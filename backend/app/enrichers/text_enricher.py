import re
import unicodedata
from typing import Optional

from app.core.constants import (
    MAX_CARACTERES_TIPO,
    MAX_LINHAS_ORGAO,
    MAX_TEXTO_ORGAO,
    PALAVRAS_IGNORAR_ORGAO,
    REGEX_PATTERNS,
)


TIPOS_DOCUMENTAIS = (
    "INSTRUCAO NORMATIVA",
    "EXONERACAO",
    "NOMEACAO",
    "RESOLUCAO",
    "LICITACAO",
    "CONTRATO",
    "DECRETO",
    "DESPACHO",
    "PORTARIA",
    "RESULTADO",
    "EXTRATO",
    "EDITAL",
    "ERRATA",
    "AVISO",
    "TERMO",
    "RESUMO",
    "ATA",
    "ATO",
    "LEI",
)

PALAVRAS_ORGAO = {
    "AGENCIA",
    "ASSEMBLEIA",
    "AUTARQUIA",
    "COMPANHIA",
    "CONSELHO",
    "DEPARTAMENTO",
    "DIRETORIA",
    "EMPRESA",
    "FUNDACAO",
    "HOSPITAL",
    "INSTITUTO",
    "POLICIA",
    "PREFEITURA",
    "PROCURADORIA",
    "SECRETARIA",
    "SUPERINTENDENCIA",
    "TRIBUNAL",
    "UNIVERSIDADE",
}

SIGLAS_ORGAO = {
    "ADAB",
    "AGERBA",
    "CAR",
    "CONDER",
    "DETRAN",
    "EMBASA",
    "FAPESB",
    "IPAC",
    "SAEB",
    "SEC",
    "SEFAZ",
    "SEI",
    "SESAB",
    "SSP",
    "UESB",
    "UNEB",
}


def _normalizar(texto: str) -> str:
    texto_sem_acento = unicodedata.normalize("NFKD", texto)
    texto_sem_acento = "".join(
        char for char in texto_sem_acento if not unicodedata.combining(char)
    )
    return re.sub(r"\s+", " ", texto_sem_acento).strip().upper()


def _limpar_linha(texto: str) -> str:
    return re.sub(r"\s+", " ", texto).strip(" -:\t")


class TextEnricher:
    @staticmethod
    def detectar_orgao(texto: str) -> Optional[str]:
        candidatos: list[str] = []

        for linha in texto.splitlines()[:MAX_LINHAS_ORGAO]:
            linha = _limpar_linha(linha)
            if not linha or len(linha) > MAX_TEXTO_ORGAO:
                continue

            if linha == linha.upper() and any(char.isalpha() for char in linha):
                candidatos.append(linha)

        for candidato in candidatos:
            candidato_upper = _normalizar(candidato)
            palavras = set(re.findall(r"[A-Z0-9]+", candidato_upper))

            if candidato_upper.startswith("%PDF"):
                continue

            if candidato_upper in {"O", "A", "O(A)"}:
                continue

            if candidato_upper in set(TIPOS_DOCUMENTAIS):
                continue

            if any(candidato_upper.startswith(f"{tipo} ") for tipo in TIPOS_DOCUMENTAIS):
                continue

            if any(_normalizar(ruim) in candidato_upper for ruim in PALAVRAS_IGNORAR_ORGAO):
                continue

            if any(palavra in palavras for palavra in PALAVRAS_ORGAO | SIGLAS_ORGAO):
                return candidato

        return None

    @staticmethod
    def detectar_tipo_documental(titulo: str, texto: str) -> str:
        base = _normalizar(f"{titulo}\n{texto[:MAX_CARACTERES_TIPO]}")

        for tipo in TIPOS_DOCUMENTAIS:
            if re.search(rf"\b{tipo}\b", base):
                return tipo

        return "OUTROS"

    @staticmethod
    def extrair_entidades(texto: str) -> dict[str, list[str]]:
        entidades: dict[str, list[str]] = {}
        for nome, pattern in REGEX_PATTERNS.items():
            matches = pattern.findall(texto)
            if matches:
                entidades[nome] = list(set(matches))
        return entidades
