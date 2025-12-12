import asyncio
import hashlib
import json
import logging
from pathlib import Path
from typing import Optional

import httpx
import websockets
from fastapi import APIRouter, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response, StreamingResponse
from starlette.background import BackgroundTask

logger = logging.getLogger(__name__)
router = APIRouter()
cache_dir = Path("./cache")
# 完全本地化：使用原始 URL 格式计算 hash，以匹配现有缓存文件
base_url = 'https://uiauto.dev'

@router.get("/")
@router.get("/android/{path:path}")
@router.get("/ios/{path:path}")
@router.get("/demo/{path:path}")
@router.get("/harmony/{path:path}")
async def proxy_html(request: Request):
    """代理 HTML 页面：优先使用缓存，缓存未命中时从远程下载"""
    cache = HTTPCache(cache_dir, base_url, key='homepage')
    response = await cache.get_or_fetch_response(request)
    if not response:
        logger.error(f"无法获取页面: {request.url.path}")
        return Response(
            content=b"<html><body><h1>Error</h1><p>Failed to fetch page from remote server.</p></body></html>",
            status_code=500,
            headers={"content-type": "text/html; charset=utf-8"}
        )
    return response

@router.get("/assets/{path:path}")
@router.get('/favicon.ico')
async def proxy_assets(request: Request, path: str = ""):
    """代理静态资源：优先使用缓存，缓存未命中时从远程下载"""
    target_url = f"{base_url}{request.url.path}"
    cache = HTTPCache(cache_dir, target_url)
    response = await cache.get_or_fetch_response(request)
    if not response:
        logger.error(f"无法获取资源: {request.url.path}")
        return Response(content=b"", status_code=404)
    return response


class HTTPCache:
    """HTTP 缓存类：优先使用缓存，缓存未命中时从远程下载"""
    def __init__(self, cache_dir: Path, target_url: str, key: Optional[str] = None):
        self.cache_dir = cache_dir
        self.target_url = target_url
        self.key = key or hashlib.md5(target_url.encode()).hexdigest()
        self.file_body = self.cache_dir / 'http' / (self.key + ".body")
        self.file_headers = self.file_body.with_suffix(".headers")

    async def get_cached_response(self, request: Request):
        """仅从本地缓存读取"""
        if request.method == 'GET' and self.file_body.exists():
            logger.info(f"本地缓存命中: {self.file_body}")
            headers = {}
            if self.file_headers.exists():
                with self.file_headers.open('rb') as f:
                    headers = json.load(f)
                # 过滤掉 content-encoding，因为缓存的内容已经是解压后的
                headers = {
                    k: v for k, v in headers.items()
                    if k.lower() not in ['content-encoding']
                }
            body_fd = self.file_body.open("rb")
            return StreamingResponse(
                content=body_fd,
                status_code=200,
                headers=headers,
                background=BackgroundTask(body_fd.close)
            )
        logger.debug(f"本地缓存未命中: {self.file_body}")
        return None

    async def get_or_fetch_response(self, request: Request):
        """优先使用缓存，缓存未命中时从远程下载并保存"""
        # 先尝试从缓存读取
        cached = await self.get_cached_response(request)
        if cached:
            return cached

        # 缓存未命中，从远程下载
        logger.info(f"从远程下载: {self.target_url}")
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(self.target_url)
                response.raise_for_status()

                # 保存到缓存
                self.file_body.parent.mkdir(parents=True, exist_ok=True)

                # 保存响应体
                with self.file_body.open('wb') as f:
                    f.write(response.content)

                # 保存响应头（过滤掉不需要的头，包括 content-encoding）
                # httpx 自动解压内容，所以保存的是未压缩的，不应包含 content-encoding
                headers_to_save = {
                    k: v for k, v in response.headers.items()
                    if k.lower() not in ['content-length', 'transfer-encoding', 'connection', 'content-encoding']
                }
                with self.file_headers.open('w') as f:
                    json.dump(headers_to_save, f)

                logger.info(f"已保存到缓存: {self.file_body}")

                # 返回响应
                return Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=headers_to_save
                )
        except Exception as e:
            logger.error(f"下载失败: {self.target_url}, 错误: {e}")
            return None


# 注意：WebSocket 转发和反向代理功能已移除
# 本地化版本不再需要这些远程请求功能
# 如需恢复，请参考原始 uiautodev 项目