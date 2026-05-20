import pytest
from app.enrichers.text_enricher import TextEnricher

def test_detectar_orgao():
    texto = "PREFEITURA MUNICIPAL DE SALVADOR\nSECRETARIA DE SAÚDE\nExtrato de Contrato..."
    orgao = TextEnricher.detectar_orgao(texto)
    
    # "PREFEITURA MUNICIPAL DE SALVADOR" é ignorado pois contém "SALVADOR" (em PALAVRAS_IGNORAR_ORGAO)
    assert orgao == "SECRETARIA DE SAÚDE"

def test_detectar_orgao_ignorado():
    texto = "GOVERNO DO ESTADO DA BAHIA\nDIÁRIO OFICIAL\nSECRETARIA DA FAZENDA\nExtrato de Licitação..."
    orgao = TextEnricher.detectar_orgao(texto)
    
    # "GOVERNO DO ESTADO DA BAHIA" e "DIÁRIO OFICIAL" devem ser ignorados
    assert orgao == "SECRETARIA DA FAZENDA"

def test_detectar_tipo_documental():
    texto = "O Prefeito, no uso de suas atribuições...\nRESOLVE:"
    titulo = "DECRETO Nº 12.345/2026"
    
    tipo = TextEnricher.detectar_tipo_documental(titulo, texto)
    assert tipo == "DECRETO"

def test_extrair_entidades():
    texto = "A empresa XPTO LTDA, inscrita no CNPJ 12.345.678/0001-90, CPF 123.456.789-00, valor global R$ 1.500,00."
    entidades = TextEnricher.extrair_entidades(texto)
    
    assert "cnpj" in entidades
    assert "12.345.678/0001-90" in entidades["cnpj"]
    
    assert "cpf" in entidades
    assert "123.456.789-00" in entidades["cpf"]
    
    assert "valor_monetario" in entidades
    assert "R$ 1.500,00" in entidades["valor_monetario"]
    assert entidades["summary"]["status"] == "ok"
    assert entidades["summary"]["total"] == 3
    assert entidades["summary"]["types"]["cnpj"]["label"] == "CNPJ"


def test_extrair_entidades_ignora_pdf_bruto():
    texto = "%PDF-1.7\n1 0 obj\nstream\n0000000219\nendobj\nxref\ntrailer\n%%EOF"
    entidades = TextEnricher.extrair_entidades(texto)

    assert entidades["items"] == {}
    assert entidades["summary"]["status"] == "ignored"
    assert entidades["summary"]["reason"] == "raw_or_corrupted_content"


def test_extrair_entidades_filtra_telefone_invalido():
    texto = "Contatos: 0000000219, 7199999-1234 e (71) 3333-4444."
    entidades = TextEnricher.extrair_entidades(texto)

    assert "0000000219" not in entidades.get("telefone", [])
    assert "7199999-1234" in entidades["telefone"]
    assert "(71) 3333-4444" in entidades["telefone"]
