import re
from selectolax.lexbor import LexborHTMLParser


class DOOLParser:
    TAGS_REMOVIDAS_HTML = "script, style, noscript, iframe, object, embed"
    ATRIBUTOS_PERMITIDOS = {
        "href",
        "src",
        "alt",
        "title",
        "colspan",
        "rowspan",
    }

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
        for tag in parser.css("script, style"):
            tag.remove()

        texto = parser.text(separator="\n", strip=True)
        return DOOLParser.limpar_texto(texto)

    @staticmethod
    def extrair_html_materia(html_materia: str):
        parser = LexborHTMLParser(html_materia)

        for tag in parser.css(DOOLParser.TAGS_REMOVIDAS_HTML):
            tag.remove()

        for node in parser.css("*"):
            for attr, value in list(node.attrs.items()):
                attr_normalizado = attr.lower()
                valor_normalizado = value.strip().lower() if value else ""

                if attr_normalizado.startswith("on"):
                    del node.attrs[attr]
                    continue

                if attr_normalizado not in DOOLParser.ATRIBUTOS_PERMITIDOS:
                    del node.attrs[attr]
                    continue

                if attr_normalizado in {"href", "src"} and valor_normalizado.startswith("javascript:"):
                    del node.attrs[attr]

        body = parser.body
        html = body.inner_html if body else parser.html
        return DOOLParser.limpar_html(html)

    @staticmethod
    def limpar_texto(texto: str):
        texto = re.sub(r"\n{3,}", "\n\n", texto)
        texto = re.sub(r"[ \t]{2,}", " ", texto)
        return texto.strip()

    @staticmethod
    def limpar_html(html: str):
        html = re.sub(r">\s+<", "><", html)
        return html.strip()
