from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
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


async def buscar_edicao_por_hash(db: AsyncSession, hash_conteudo: str) -> Optional[Edicao]:
    """Verificar se edição já foi processada"""
    result = await db.execute(
        select(Edicao).where(Edicao.hash_conteudo == hash_conteudo)
    )
    return result.scalar_one_or_none()


async def buscar_edicao_por_data(db: AsyncSession, data: date) -> Optional[Edicao]:
    """Buscar edição por data"""
    result = await db.execute(
        select(Edicao).where(Edicao.data == data)
    )
    return result.scalar_one_or_none()


async def listar_edicoes(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0
) -> List[Edicao]:
    result = await db.execute(
        select(Edicao)
        .order_by(Edicao.data.desc())
        .limit(limit)
        .offset(offset)
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
        orgao=orgao,
        tipo_documental=tipo_documental,
        entidades=entidades,
        url=url
    )
    db.add(materia)
    await db.commit()
    await db.refresh(materia)
    return materia


async def buscar_materia_por_id_original(
    db: AsyncSession,
    materia_id_original: str
) -> Optional[Materia]:
    """Verificar se matéria já foi processada"""
    result = await db.execute(
        select(Materia).where(
            Materia.materia_id_original == materia_id_original)
    )
    return result.scalar_one_or_none()


async def listar_materias_por_edicao(
    db: AsyncSession,
    edicao_id: int
) -> List[Materia]:
    """Listar matérias de uma edição"""
    result = await db.execute(
        select(Materia)
        .where(Materia.edicao_id == edicao_id)
        .order_by(Materia.id)
    )
    return result.scalars().all()


async def buscar_materias(
    db: AsyncSession,
    orgao: Optional[str] = None,
    tipo_documental: Optional[str] = None,
    limit: int = 50
) -> List[Materia]:
    """Buscar matérias com filtros"""
    query = select(Materia)

    if orgao:
        query = query.where(Materia.orgao.ilike(f"%{orgao}%"))

    if tipo_documental:
        query = query.where(Materia.tipo_documental == tipo_documental)

    query = query.order_by(Materia.created_at.desc()).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


async def atualizar_total_materias(db: AsyncSession, edicao_id: int):
    """Atualizar contador usando subquery"""
    subquery = (
        select(func.count(Materia.id))
        .where(Materia.edicao_id == edicao_id)
        .scalar_subquery()
    )

    await db.execute(
        update(Edicao)
        .where(Edicao.id == edicao_id)
        .values(total_materias=subquery)
    )
    await db.commit()


async def buscar_materias(
    db: AsyncSession,
    query: str,
    limit: int = 20,
    offset: int = 0
) -> List[Materia]:
    """Busca matérias usando Full-Text Search (Postgres)"""
    result = await db.execute(
        select(Materia)
        .where(Materia.search_vector.op("@@")(func.to_tsquery('portuguese', query)))
        .order_by(Materia.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
