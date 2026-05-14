import httpx
from typing import Optional, Any
from app.core.config import settings

class DOOLApiError(Exception):
    """Exceção customizada para erros da API do DOOL."""
    pass

class DOOLCollector:
    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.base_url = settings.dool_base_url

    async def buscar_edicao(self, data: str) -> Optional[dict[str, Any]]:
        url = f"{self.base_url}/apifront/portal/edicoes/edicoes_from_data/{data}"
        response = await self.client.get(url)
        response.raise_for_status()
        dados = response.json()

        if dados.get("erro"):
            raise DOOLApiError(dados["msg"])

        if not dados.get("itens"):
            return None

        return dados["itens"][0]

    async def baixar_sumario(self, edicao_id: int) -> str:
        url = f"{self.base_url}/html/{edicao_id}.html"
        response = await self.client.get(url)
        response.raise_for_status()
        
        html = response.text
        
        # Opcional: salvar cache local se configurado
        if settings.debug:
            path = settings.data_dir / f"sumario_{edicao_id}.html"
            path.write_text(html, encoding="utf-8")
            
        return html

    async def baixar_materia_html(self, materia_id: str) -> str:
        url = f"{self.base_url}/apifront/portal/edicoes/publicacoes_ver_conteudo/{materia_id}"
        response = await self.client.get(url)
        response.raise_for_status()
        return response.text
