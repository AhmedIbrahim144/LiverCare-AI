"""
الملف ده مسؤول عن:
- إنشاء الـ Embedding Model اللي بيحوّل النص لأرقام (Vectors)
- بنستخدم BAAI/bge-small-en-v1.5 محلياً (مجاني وسريع)
- فيه دعم لـ OpenAI Embeddings لو عايزين نستخدمهم
- الـ Embeddings مهمة عشان نعمل Semantic Search
"""

from backend.config import EMBEDDING_PROVIDER, LOCAL_EMBEDDING_MODEL, OPENAI_EMBEDDING_MODEL


def get_embeddings(provider=None):
    """
    الدالة دي بترجع الـ Embedding Model المناسب
    
    لو provider == "openai": بنستخدم OpenAI Embeddings (محتاج API Key)
    لو provider == "local": بنستخدم FastEmbed محلياً (مجاني)
    
    FastEmbedEmbeddings بتحمّل الموديل Localamente أول مرة
    وبتخزنه عشان ما نحمّلهوش كل مرة
    """
    provider = provider or EMBEDDING_PROVIDER

    if provider == "openai":
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(model=OPENAI_EMBEDDING_MODEL)

    # استخدام FastEmbed محلياً - مجاني وسريع ومش محتاج API Key
    from langchain_community.embeddings import FastEmbedEmbeddings
    return FastEmbedEmbeddings(model_name=LOCAL_EMBEDDING_MODEL)