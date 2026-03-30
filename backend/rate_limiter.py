"""
Shared rate limiter instance.
Отдельный модуль чтобы избежать circular imports между main.py и routes/*.py
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
