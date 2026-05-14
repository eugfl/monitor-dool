"""Constantes e padrões da aplicação"""

import re

# =========================================================
# PADRÕES DE TIPO DOCUMENTAL
# =========================================================

PADROES_TIPO_DOCUMENTAL = {
    "LEI": r"\bLEI\b",
    "DECRETO": r"\bDECRETO\b",
    "PORTARIA": r"\bPORTARIA\b",
    "RESOLUÇÃO": r"\bRESOLUÇÃO\b",
    "EDITAL": r"\bEDITAL\b",
    "AVISO": r"\bAVISO\b",
    "DESPACHO": r"\bDESPACHO\b",
    "EXTRATO": r"\bEXTRATO\b",
    "LICITAÇÃO": r"\bLICITAÇÃO\b",
    "CONTRATO": r"\bCONTRATO\b",
    "NOMEAÇÃO": r"\bNOMEA(C|Ç)(Ã|A)O\b",
    "EXONERAÇÃO": r"\bEXONERA(C|Ç)(Ã|A)O\b",
    "ATA": r"\bATA\b",
    "INSTRUÇÃO NORMATIVA": r"\bINSTRU(C|Ç)(Ã|A)O\s+NORMATIVA\b",
}

# =========================================================
# PADRÕES DE ENTIDADES (REGEX)
# =========================================================

REGEX_PATTERNS = {
    # Documentos
    "cpf": re.compile(r"\d{3}\.\d{3}\.\d{3}-\d{2}"),
    "cnpj": re.compile(r"\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}"),
    "processo_cnj": re.compile(r"\d{7}-\d{2}\.\d{4}\.\d{1}\.\d{2}\.\d{4}"),

    # Contato
    "email": re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"),
    "telefone": re.compile(r"\(?\d{2}\)?\s?\d{4,5}-?\d{4}"),

    # Financeiro
    "valor_monetario": re.compile(r"R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?"),

    # Jurídico
    "oab": re.compile(r"OAB/[A-Z]{2}\s?\d{4,6}"),
}

# =========================================================
# PALAVRAS-CHAVE PARA FILTRO (DETECÇÃO DE ÓRGÃO)
# =========================================================

PALAVRAS_IGNORAR_ORGAO = [
    "DIÁRIO OFICIAL",
    "PÁGINA",
    "SALVADOR",
    "BAHIA",
    "ANO",
    "EXECUTIVO",
    "PODER",
    "GOVERNO",
    "ESTADO",
]

# =========================================================
# LIMITES DE PROCESSAMENTO
# =========================================================

MAX_TEXTO_ORGAO = 150  # Caracteres para detectar órgão
MAX_LINHAS_ORGAO = 50  # Primeiras N linhas para buscar órgão
MAX_CARACTERES_TIPO = 2000  # Primeiros N chars para tipo documental
