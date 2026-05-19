from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_
from sqlalchemy.orm import selectinload
from app.database.models import Edicao, Materia
from typing import List, Optional
from datetime import date


ORGAOS_INVALIDOS = {
    "PDF",
    "HTML",
    "DOE",
    "DOOL",
    "DIARIO OFICIAL",
    "DIÁRIO OFICIAL",
}

TIPOS_LABELS = {
    "ATO": "Ato",
    "AVISO": "Aviso",
    "CONTRATO": "Contrato",
    "DECRETO": "Decreto",
    "EDITAL": "Edital",
    "LEI": "Lei",
    "LICITACAO": "Licitação",
    "LICITAÇÃO": "Licitação",
    "NAO_IDENTIFICADO": "Outros",
    "NÃO_IDENTIFICADO": "Outros",
    "OUTROS": "Outros",
    "PORTARIA": "Portaria",
    "RESOLUCAO": "Resolução",
    "RESOLUÇÃO": "Resolução",
}

SIGLAS = {
    "ADAB",
    "AGERBA",
    "BAHIAGÁS",
    "CNPJ",
    "CPF",
    "DETRAN",
    "EMBASA",
    "FAPESB",
    "IPAC",
    "PM",
    "SAEB",
    "SEC",
    "SEFAZ",
    "SEI",
    "SESAB",
    "SSP",
    "UNEB",
}


def _normalizar_espacos(value: str) -> str:
    return " ".join(value.replace("_", " ").split())


def _formatar_label(value: str) -> str:
    texto = _normalizar_espacos(value)
    palavras = []

    for palavra in texto.split(" "):
        palavra_upper = palavra.upper()
        if palavra_upper in SIGLAS:
            palavras.append(palavra_upper)
        elif len(palavra) <= 2 and palavra_upper not in {"DA", "DE", "DO", "DAS", "DOS", "E"}:
            palavras.append(palavra_upper)
        else:
            palavras.append(palavra.lower().capitalize())

    return " ".join(palavras)


def _formatar_tipo(value: Optional[str]) -> str:
    if not value:
        return "Outros"

    tipo = _normalizar_espacos(value).upper()
    return TIPOS_LABELS.get(tipo, _formatar_label(tipo))


def _orgao_valido(value: Optional[str]) -> bool:
    if not value:
        return False

    orgao = _normalizar_espacos(value)
    orgao_upper = orgao.upper()
    return len(orgao) >= 3 and orgao_upper not in ORGAOS_INVALIDOS and not orgao_upper.endswith(".PDF")

# =========================================================
# CRUD EDIÇÃO
# =========================================================


async def criar_edicao(
    db: AsyncSession,
    numero: int,
    data: date,
    tipo: str,
    url_original: str,
    hash_conteudo: str
) -> Edicao:
    """Criar nova edição"""
    edicao = Edicao(
        numero=numero,
        data=data,
        tipo=tipo,
        url_original=url_original,
        hash_conteudo=hash_conteudo
    )
    db.add(edicao)
    await db.commit()
    await db.refresh(edicao)
    return edicao


async def buscar_edicao_por_id(db: AsyncSession, id: int) -> Optional[Edicao]:
    """Buscar edição por ID único"""
    result = await db.execute(select(Edicao).where(Edicao.id == id))
    return result.scalar_one_or_none()


async def buscar_edicao_por_hash(db: AsyncSession, hash_conteudo: str) -> Optional[Edicao]:
    """Verificar se edição já foi processada via hash"""
    result = await db.execute(select(Edicao).where(Edicao.hash_conteudo == hash_conteudo))
    return result.scalar_one_or_none()


async def buscar_edicao_por_data(db: AsyncSession, data: date) -> Optional[Edicao]:
    """Buscar edição por data"""
    result = await db.execute(select(Edicao).where(Edicao.data == data))
    return result.scalar_one_or_none()


async def listar_edicoes(db: AsyncSession, limit: int = 50, offset: int = 0) -> List[Edicao]:
    """Listar últimas edições processadas"""
    result = await db.execute(
        select(Edicao).order_by(Edicao.data.desc()).limit(limit).offset(offset)
    )
    return result.scalars().all()

# =========================================================
# CRUD MATÉRIA
# =========================================================


async def criar_materia(
    db: AsyncSession,
    edicao_id: int,
    materia_id_original: str,
    titulo: str,
    texto: str,
    conteudo_html: Optional[str],
    orgao: Optional[str],
    tipo_documental: str,
    entidades: dict,
    url: str
) -> Materia:
    """Criar nova matéria"""
    materia = Materia(
        edicao_id=edicao_id,
        materia_id_original=materia_id_original,
        titulo=titulo,
        texto=texto,
        conteudo_html=conteudo_html,
        orgao=orgao,
        tipo_documental=tipo_documental,
        entidades=entidades,
        url=url,
    )
    db.add(materia)
    await db.flush()
    await db.refresh(materia)
    return materia


async def buscar_materia_por_id(db: AsyncSession, id: int) -> Optional[Materia]:
    """Buscar matéria por ID interno"""
    result = await db.execute(
        select(Materia).options(selectinload(Materia.edicao)).where(Materia.id == id)
    )
    return result.scalar_one_or_none()


async def buscar_materia_por_id_original(db: AsyncSession, materia_id_original: str) -> Optional[Materia]:
    """Buscar matéria pelo ID original do site"""
    result = await db.execute(select(Materia).where(Materia.materia_id_original == materia_id_original))
    return result.scalar_one_or_none()


async def listar_materias_por_edicao(db: AsyncSession, edicao_id: int) -> List[Materia]:
    """Listar todas as matérias de uma edição específica"""
    result = await db.execute(
        select(Materia).where(Materia.edicao_id ==
                              edicao_id).order_by(Materia.id)
    )
    return result.scalars().all()


async def buscar_materias(
    db: AsyncSession,
    q: Optional[str] = None,
    orgao: Optional[str] = None,
    tipo_documental: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    limit: int = 20,
    offset: int = 0
) -> List[Materia]:
    """Busca avançada de matérias com FTS e filtros"""
    query = select(Materia).options(selectinload(Materia.edicao)).join(Edicao)

    filters = []

    # Busca Full-Text
    if q:
        filters.append(Materia.search_vector.op(
            "@@")(func.plainto_tsquery('portuguese', q)))

    # Filtros por metadados
    if orgao:
        filters.append(Materia.orgao.ilike(f"%{orgao}%"))
    if tipo_documental:
        filters.append(Materia.tipo_documental == tipo_documental)

    # Filtros por data (da edição)
    if data_inicio:
        filters.append(Edicao.data >= data_inicio)
    if data_fim:
        filters.append(Edicao.data <= data_fim)

    if filters:
        query = query.where(and_(*filters))

    query = query.order_by(Edicao.data.desc(), Materia.id.desc()).limit(limit).offset(offset)

    result = await db.execute(query)
    return result.scalars().all()


async def obter_estatisticas_tipos(db: AsyncSession):
    """Contagem de matérias por tipo documental"""
    result = await db.execute(
        select(Materia.tipo_documental, func.count(Materia.id))
        .group_by(Materia.tipo_documental)
        .order_by(func.count(Materia.id).desc())
    )
    return [{"label": row[0], "value": row[1]} for row in result.all()]


async def obter_estatisticas_orgaos(db: AsyncSession, limit: int = 10):
    """Top órgãos que mais publicam"""
    result = await db.execute(
        select(Materia.orgao, func.count(Materia.id))
        .group_by(Materia.orgao)
        .order_by(func.count(Materia.id).desc())
        .limit(limit)
    )
    return [{"label": row[0], "value": row[1]} for row in result.all()]


async def obter_opcoes_filtros(db: AsyncSession):
    """Opcoes normalizadas para os selects de filtros."""
    orgaos_result = await db.execute(
        select(Materia.orgao, func.count(Materia.id))
        .where(Materia.orgao.is_not(None))
        .group_by(Materia.orgao)
        .order_by(func.count(Materia.id).desc(), Materia.orgao.asc())
        .limit(100)
    )

    tipos_result = await db.execute(
        select(Materia.tipo_documental, func.count(Materia.id))
        .where(Materia.tipo_documental.is_not(None))
        .group_by(Materia.tipo_documental)
        .order_by(func.count(Materia.id).desc(), Materia.tipo_documental.asc())
    )

    orgaos = [
        {"value": row[0], "label": _formatar_label(row[0])}
        for row in orgaos_result.all()
        if _orgao_valido(row[0])
    ]

    tipos = [
        {"value": row[0], "label": _formatar_tipo(row[0])}
        for row in tipos_result.all()
        if row[0]
    ]

    return {"orgaos": orgaos, "tipos": tipos}


async def obter_resumo_dashboard(db: AsyncSession):
    """Resumo consolidado para a dashboard."""
    totals_result = await db.execute(
        select(
            func.count(Materia.id),
            func.count(func.distinct(Edicao.id)),
            func.count(func.distinct(Materia.orgao)),
            func.max(Edicao.created_at),
        )
        .select_from(Edicao)
        .outerjoin(Materia, Materia.edicao_id == Edicao.id)
    )
    total_materias, total_edicoes, total_orgaos, ultima_coleta_em = totals_result.one()

    latest_result = await db.execute(
        select(Edicao.data, Edicao.numero)
        .order_by(Edicao.data.desc(), Edicao.created_at.desc())
        .limit(1)
    )
    latest = latest_result.one_or_none()

    return {
        "total_materias": total_materias or 0,
        "total_edicoes": total_edicoes or 0,
        "total_orgaos": total_orgaos or 0,
        "ultima_edicao_data": latest[0] if latest else None,
        "ultima_edicao_numero": latest[1] if latest else None,
        "ultima_coleta_em": ultima_coleta_em,
    }


async def atualizar_total_materias(db: AsyncSession, edicao_id: int):
    """Atualizar contador de matérias da edição usando subquery atômica"""
    subquery = (
        select(func.count(Materia.id))
        .where(Materia.edicao_id == edicao_id)
        .scalar_subquery()
    )

    await db.execute(
        update(Edicao).where(Edicao.id == edicao_id).values(
            total_materias=subquery)
    )
    await db.commit()
