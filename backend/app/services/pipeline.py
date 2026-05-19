import asyncio
import hashlib
import httpx
from loguru import logger
from datetime import date

from app.core.config import settings
from app.collectors.dool_collector import DOOLCollector
from app.parsers.html_parser import DOOLParser
from app.enrichers.text_enricher import TextEnricher
from app.database import crud
from app.database.database import AsyncSessionLocal


class PipelineService:
    def __init__(self) -> None:
        self.limits = httpx.Limits(max_connections=50, max_keepalive_connections=20)
        self.headers = {"User-Agent": settings.user_agent}

    async def processar_dia(self, data_str: str) -> dict[str, int | str | None]:
        """
        Orquestra a coleta e processamento de todas as matérias de um dia.

        Fluxo:
            1. Buscar edição na API do DOOL
            2. Baixar sumário HTML e gerar hash (idempotência)
            3. Salvar edição no banco (ou pular se hash já existe)
            4. Extrair lista de matérias do sumário
            5. Baixar e enriquecer matérias em paralelo (com semaphore)
            6. Salvar matérias novas em transação única
            7. Atualizar contador total_materias
        """
        async with httpx.AsyncClient(
            verify=False,
            follow_redirects=True,
            timeout=settings.dool_timeout,
            headers=self.headers,
            limits=self.limits,
        ) as client:
            collector = DOOLCollector(client)
            parser = DOOLParser()
            enricher = TextEnricher()

            logger.info(f"Iniciando processamento para data: {data_str}")

            # 1. Buscar edição
            edicao_data = await collector.buscar_edicao(data_str)
            if not edicao_data:
                logger.warning(f"Nenhuma edição encontrada para {data_str}")
                return {
                    "status": "no_edition",
                    "message": f"Nenhuma edicao encontrada para {data_str}.",
                    "edicao_id": None,
                    "materias_novas": 0,
                }

            edicao_id = edicao_data["id"]
            logger.info(f"Edição encontrada: ID={edicao_id}")

            # 2. Baixar sumário e gerar hash para idempotência
            html_sumario = await collector.baixar_sumario(edicao_id)
            hash_sumario = hashlib.sha256(html_sumario.encode("utf-8")).hexdigest()

            async with AsyncSessionLocal() as db:
                # 3. Verificar duplicata via hash
                db_edicao = await crud.buscar_edicao_por_hash(db, hash_sumario)

                if not db_edicao:
                    db_edicao = await crud.criar_edicao(
                        db=db,
                        numero=int(edicao_data["numero"]),
                        data=date.fromisoformat(data_str),
                        tipo=edicao_data.get("tipo", "Executivo"),
                        url_original=f"{settings.dool_base_url}/html/{edicao_id}.html",
                        hash_conteudo=hash_sumario,
                    )
                    logger.info(f"Nova edição salva: id={db_edicao.id}")
                else:
                    logger.info(
                        f"Edição já processada (hash={hash_sumario[:8]}…), "
                        "processando apenas matérias novas."
                    )

                # 4. Extrair lista de matérias
                materias_lista = parser.extrair_materias(html_sumario)
                logger.info(f"{len(materias_lista)} matérias encontradas no sumário.")

                # 5. Processar matérias em paralelo com controle de concorrência
                semaphore = asyncio.Semaphore(settings.dool_max_concurrency)
                tasks = [
                    self._processar_materia(semaphore, collector, parser, enricher, m)
                    for m in materias_lista
                ]
                resultados = await asyncio.gather(*tasks)

                # 6. Salvar matérias novas em transação única (flush individual + commit ao final)
                novas = 0
                for res in resultados:
                    if not res:
                        continue
                    db_materia = await crud.buscar_materia_por_id_original(db, res["id"])
                    if not db_materia:
                        await crud.criar_materia(
                            db=db,
                            edicao_id=db_edicao.id,
                            materia_id_original=res["id"],
                            titulo=res["titulo"],
                            texto=res["texto"],
                            conteudo_html=res["conteudo_html"],
                            orgao=res["orgao"],
                            tipo_documental=res["tipo_documental"],
                            entidades=res["entidades"],
                            url=res["url"],
                        )
                        novas += 1

                # Commit único ao final — transação atômica para todas as matérias
                await db.commit()

                # 7. Atualizar contador
                await crud.atualizar_total_materias(db, db_edicao.id)
                logger.info(
                    f"Processamento concluído: {novas} matérias novas salvas "
                    f"(edição ID={db_edicao.id})"
                )
                return {
                    "status": "success",
                    "message": f"Coleta de {data_str} concluida com {novas} materias novas.",
                    "edicao_id": db_edicao.id,
                    "materias_novas": novas,
                }

    async def _processar_materia(
        self,
        semaphore: asyncio.Semaphore,
        collector: DOOLCollector,
        parser: DOOLParser,
        enricher: TextEnricher,
        materia_info: dict,
    ) -> dict | None:
        """
        Baixa e enriquece uma matéria individual com controle de concorrência.

        O semaphore limita a quantas requisições HTTP simultâneas são feitas,
        evitando sobrecarregar o servidor do DOOL.
        """
        materia_id = materia_info["id"]
        async with semaphore:
            try:
                html = await collector.baixar_materia_html(materia_id)
                texto = parser.extrair_texto_materia(html)
                conteudo_html = parser.extrair_html_materia(html)
                orgao = enricher.detectar_orgao(texto)
                tipo = enricher.detectar_tipo_documental(materia_info["titulo"], texto)
                entidades = enricher.extrair_entidades(texto)

                return {
                    "id": materia_id,
                    "titulo": materia_info["titulo"],
                    "texto": texto,
                    "conteudo_html": conteudo_html,
                    "orgao": orgao,
                    "tipo_documental": tipo,
                    "entidades": entidades,
                    "url": (
                        f"{settings.dool_base_url}"
                        f"/apifront/portal/edicoes/publicacoes_ver_conteudo/{materia_id}"
                    ),
                }
            except Exception as e:
                logger.error(f"Erro ao processar matéria {materia_id}: {e}")
                return None
