import pytest
from app.parsers.html_parser import DOOLParser

def test_extrair_materias():
    html_mock = """
    <html>
        <body>
            <a identificador="12345">Materia 1</a>
            <a data-materia-id="67890">Materia 2</a>
            <a>Materia sem ID</a>
            <a identificador="12345">Materia Duplicada</a>
        </body>
    </html>
    """
    materias = DOOLParser.extrair_materias(html_mock)
    
    assert len(materias) == 2
    assert materias[0]["id"] == "12345"
    assert materias[0]["titulo"] == "Materia 1"
    assert materias[1]["id"] == "67890"
    assert materias[1]["titulo"] == "Materia 2"

def test_extrair_texto_materia():
    html_mock = """
    <div>
        <script>alert('teste')</script>
        <style>.color { color: red; }</style>
        <p>Texto da matéria.</p>
        <p>Mais texto.</p>
    </div>
    """
    texto = DOOLParser.extrair_texto_materia(html_mock)
    
    assert "alert" not in texto
    assert ".color" not in texto
    assert "Texto da matéria.\n\nMais texto." in texto

def test_extrair_html_materia_preserva_tabela_e_remove_conteudo_inseguro():
    html_mock = """
    <div>
        <script>alert('teste')</script>
        <style>.color { color: red; }</style>
        <table onclick="alert('x')" style="color: red">
            <tr>
                <th>AFM N°</th>
                <th>Valor R$</th>
            </tr>
            <tr>
                <td>19.078.00544/2026</td>
                <td>R$ 747,00</td>
            </tr>
        </table>
        <a href="javascript:alert('x')">link inseguro</a>
    </div>
    """
    html = DOOLParser.extrair_html_materia(html_mock)

    assert "<table" in html
    assert "<th>AFM N°</th>" in html
    assert "<td>R$ 747,00</td>" in html
    assert "script" not in html
    assert "style=" not in html
    assert "onclick" not in html
    assert "javascript:" not in html


def test_limpar_texto():
    texto_sujo = "Texto com   muitos espaços.\n\n\n\nE muitas quebras."
    texto_limpo = DOOLParser.limpar_texto(texto_sujo)
    
    assert "Texto com muitos espaços." in texto_limpo
    assert "\n\nE muitas quebras." in texto_limpo
