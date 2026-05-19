from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, and_
from app.database.models import Edicao, Materia
from typing import List, Optional
from datetime import date

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
    result = await db.execute(select(Materia).where(Materia.id == id))
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
    query = select(Materia).join(Edicao)

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

    query = query.order_by(Materia.created_at.desc()
                           ).limit(limit).offset(offset)

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
