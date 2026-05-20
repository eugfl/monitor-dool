from app.api.v1.endpoints import materias


def test_parece_pdf_by_content_type():
    assert materias._parece_pdf(b"not a real pdf", "application/pdf")


def test_parece_pdf_by_file_signature():
    assert materias._parece_pdf(b"%PDF-1.7\nbody", "text/plain")


def test_parece_pdf_by_pdf_markers():
    content = b"random\nendobj\nxref\ntrailer\nnot enough to be readable"

    assert materias._parece_pdf(content, "text/plain")


def test_parece_pdf_rejects_html():
    assert not materias._parece_pdf(b"<html><body>Materia</body></html>", "text/html")


def test_pdf_filename_sanitizes_original_id():
    assert materias._pdf_filename(12, "19.180/PE 001/2025") == "materia-19-180-PE-001-2025.pdf"


def test_pdf_filename_falls_back_to_internal_id():
    assert materias._pdf_filename(12, "///") == "materia-12.pdf"
