import re
from typing import Optional, Any
from app.core.constants import PADROES_TIPO_DOCUMENTAL, PALAVRAS_IGNORAR_ORGAO, MAX_TEXTO_ORGAO, MAX_LINHAS_ORGAO, MAX_CARACTERES_TIPO, REGEX_PATTERNS

class TextEnricher:
    @staticmethod
    def detectar_orgao(texto: str) -> Optional[str]:
        linhas = texto.splitlines()
        candidatos = []

        for linha in linhas[:MAX_LINHAS_ORGAO]:
            linha = linha.strip()
            if not linha or len(linha) > MAX_TEXTO_ORGAO:
                continue

            linha_upper = linha.upper()
            if linha == linha_upper and any(c.isalpha() for c in linha):
                candidatos.append(linha)

        for candidato in candidatos:
            ignorar = False
            for ruim in PALAVRAS_IGNORAR_ORGAO:
                if ruim in candidato:
                    ignorar = True
                    break
            
            if not ignorar:
                return candidato
        
        return None

    @staticmethod
    def detectar_tipo_documental(titulo: str, texto: str) -> str:
        base = f"{titulo}\n{texto[:MAX_CARACTERES_TIPO]}".upper()

        for tipo, regex in PADROES_TIPO_DOCUMENTAL.items():
            if re.search(regex, base):
                return tipo
        
        return "NÃO IDENTIFICADO"

    @staticmethod
    def extrair_entidades(texto: str) -> dict[str, list[str]]:
        # Extração de CPF, CNPJ, etc usando regex de constants.py
        entidades: dict[str, list[str]] = {}
        for nome, pattern in REGEX_PATTERNS.items():
            matches = pattern.findall(texto)
            if matches:
                entidades[nome] = list(set(matches))
        return entidades
