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

ENTIDADE_LABELS = {
    "cpf": "CPF",
    "cnpj": "CNPJ",
    "processo_cnj": "Processo CNJ",
    "email": "E-mail",
    "telefone": "Telefone",
    "valor_monetario": "Valor monetário",
    "oab": "OAB",
}

ENTIDADES_MAX_ITEMS = 25
PDF_MARKERS = ("%PDF-", "endobj", "xref", "trailer", "startxref", "%%EOF")


def _normalizar(texto: str) -> str:
    texto_sem_acento = unicodedata.normalize("NFKD", texto)
    texto_sem_acento = "".join(
        char for char in texto_sem_acento if not unicodedata.combining(char)
    )
    return re.sub(r"\s+", " ", texto_sem_acento).strip().upper()


def _limpar_linha(texto: str) -> str:
    return re.sub(r"\s+", " ", texto).strip(" -:\t")


def _parece_pdf_bruto(texto: str) -> bool:
    sample = texto[:5000]
    sample_lower = sample.lower()
    markers = sum(1 for marker in PDF_MARKERS if marker.lower() in sample_lower)
    return sample.lstrip().startswith("%PDF-") or markers >= 3


def _parece_texto_corrompido(texto: str) -> bool:
    if not texto.strip():
        return True

    sample = texto[:3000]
    if _parece_pdf_bruto(sample):
        return True

    control_chars = sum(1 for char in sample if ord(char) < 32 and char not in "\n\r\t")
    replacement_chars = sample.count("�") + sample.count("ï¿½")
    return control_chars > 20 or replacement_chars > 15


def _normalizar_match(match: object) -> str:
    if isinstance(match, tuple):
        return "".join(str(part) for part in match if part)

    return str(match)


def _telefone_valido(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    if len(digits) not in {10, 11}:
        return False

    if len(set(digits)) <= 2:
        return False

    return not digits.startswith("000")


def _valor_valido(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    return bool(digits) and int(digits) > 0


def _entidade_valida(nome: str, value: str) -> bool:
    if not value or len(value) > 120:
        return False

    if nome == "telefone":
        return _telefone_valido(value)

    if nome == "valor_monetario":
        return _valor_valido(value)

    return True


def _deduplicar(values: list[str]) -> list[str]:
    seen = set()
    unique = []

    for value in values:
        normalized = re.sub(r"\s+", " ", value).strip()
        if not normalized or normalized in seen:
            continue

        seen.add(normalized)
        unique.append(normalized)

    return unique


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
    def extrair_entidades(texto: str) -> dict:
        if _parece_texto_corrompido(texto):
            return {
                "items": {},
                "summary": {
                    "status": "ignored",
                    "reason": "raw_or_corrupted_content",
                    "message": "Conteúdo bruto ou corrompido; entidades não extraídas.",
                    "total": 0,
                    "types": {},
                },
            }

        items: dict[str, list[str]] = {}
        for nome, pattern in REGEX_PATTERNS.items():
            matches = [_normalizar_match(match) for match in pattern.findall(texto)]
            values = [
                value
                for value in _deduplicar(matches)
                if _entidade_valida(nome, value)
            ]

            if values:
                items[nome] = values[:ENTIDADES_MAX_ITEMS]

        total = sum(len(values) for values in items.values())

        return {
            **items,
            "items": items,
            "summary": {
                "status": "ok" if total else "empty",
                "reason": None,
                "message": (
                    "Entidades extraídas com validação básica."
                    if total
                    else "Nenhuma entidade confiável foi identificada."
                ),
                "total": total,
                "types": {
                    name: {
                        "label": ENTIDADE_LABELS.get(name, name),
                        "count": len(values),
                    }
                    for name, values in items.items()
                },
            },
        }
