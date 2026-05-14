import asyncio
import httpx
import hashlib
from loguru import logger
from datetime import date

from app.core.config import settings
from app.collectors.dool_collector import DOOLCollector
from app.parsers.html_parser import DOOLParser
from app.enrichers.text_enricher import TextEnricher
from app.database import crud
from app.database.database import AsyncSessionLocal

class PipelineService:
    def __init__(self):
        self.limits = httpx.Limits(max_connections=50, max_keepalive_connections=20)
        self.headers = {"User-Agent": settings.user_agent}

    async def processar_dia(self, data_str: str):
        async with httpx.AsyncClient(
            verify=False,
            follow_redirects=True,
            timeout=settings.dool_timeout,
            headers=self.headers,
            limits=self.limits
        ) as client:
            collector = DOOLCollector(client)
            parser = DOOLParser()
            enricher = TextEnricher()

            logger.info(f"Iniciando processamento para data: {data_str}")
            
            # 1. Buscar Edição
            edicao_data = await collector.buscar_edicao(data_str)
            if not edicao_data:
                logger.warning(f"Nenhuma edição encontrada para {data_str}")
                return

            edicao_id = edicao_data["id"]
            logger.info(f"Edição encontrada: {edicao_id}")

            # 2. Baixar Sumário para gerar Hash real
            html_sumario = await collector.baixar_sumario(edicao_id)
            hash_sumario = hashlib.sha256(html_sumario.encode("utf-8")).hexdigest()

            # 3. Salvar Edição no Banco (usando Hash para idempotência)
            async with AsyncSessionLocal() as db:
                db_edicao = await crud.buscar_edicao_por_hash(db, hash_sumario)
                
                if not db_edicao:
                    db_edicao = await crud.criar_edicao(
                        db=db,
                        numero=int(edicao_data["numero"]),
                        data=date.fromisoformat(data_str),
                        tipo=edicao_data.get("tipo", "Executivo"),
                        url_original=f"{settings.dool_base_url}/html/{edicao_id}.html",
                        hash_conteudo=hash_sumario
                    )

                # 4. Extrair matérias
                materias_lista = parser.extrair_materias(html_sumario)
                logger.info(f"{len(materias_lista)} matérias encontradas no sumário.")

                # 5. Processar matérias em paralelo
                semaphore = asyncio.Semaphore(settings.dool_max_concurrency)
                tasks = [
                    self._processar_materia(collector, parser, enricher, m, db_edicao.id)
                    for m in materias_lista
                ]
                
                resultados = await asyncio.gather(*tasks)
                
                # 6. Salvar matérias no banco
                for res in resultados:
                    if res:
                        # Evitar duplicatas de matérias
                        db_materia = await crud.buscar_materia_por_id_original(db, res["id"])
                        if not db_materia:
                            await crud.criar_materia(
                                db=db,
                                edicao_id=db_edicao.id,
                                materia_id_original=res["id"],
                                titulo=res["titulo"],
                                texto=res["texto"],
                                orgao=res["orgao"],
                                tipo_documental=res["tipo_documental"],
                                entidades=res["entidades"],
                                url=res["url"]
                            )
                
                await crud.atualizar_total_materias(db, db_edicao.id)
                logger.info(f"Processamento concluído para edição {edicao_id}")

    async def _processar_materia(self, collector, parser, enricher, materia_info, edicao_db_id):
        materia_id = materia_info["id"]
        try:
            html = await collector.baixar_materia_html(materia_id)
            texto = parser.extrair_texto_materia(html)
            orgao = enricher.detectar_orgao(texto)
            tipo = enricher.detectar_tipo_documental(materia_info["titulo"], texto)
            entidades = enricher.extrair_entidades(texto)

            return {
                "id": materia_id,
                "titulo": materia_info["titulo"],
                "texto": texto,
                "orgao": orgao,
                "tipo_documental": tipo,
                "entidades": entidades,
                "url": f"{settings.dool_base_url}/apifront/portal/edicoes/publicacoes_ver_conteudo/{materia_id}"
            }
        except Exception as e:
            logger.error(f"Erro ao processar matéria {materia_id}: {e}")
            return None
