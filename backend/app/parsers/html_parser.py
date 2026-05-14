import re
from selectolax.lexbor import LexborHTMLParser

class DOOLParser:
    @staticmethod
    def extrair_materias(html_sumario: str):
        parser = LexborHTMLParser(html_sumario)
        materias = []
        vistos = set()

        for a in parser.css("a"):
            identificador = a.attributes.get("identificador") or a.attributes.get("data-materia-id")
            titulo = a.text(strip=True)

            if not identificador:
                continue

            if identificador in vistos:
                continue

            vistos.add(identificador)
            materias.append({
                "id": identificador,
                "titulo": titulo
            })
        
        return materias

    @staticmethod
    def extrair_texto_materia(html_materia: str):
        parser = LexborHTMLParser(html_materia)
        # Remove scripts e styles se necessário
        for tag in parser.css("script, style"):
            tag.remove()
        
        texto = parser.text(separator="\n", strip=True)
        return DOOLParser.limpar_texto(texto)

    @staticmethod
    def limpar_texto(texto: str):
        texto = re.sub(r"\n{3,}", "\n\n", texto)
        texto = re.sub(r"[ \t]{2,}", " ", texto)
        return texto.strip()
