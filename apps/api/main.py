"""FastAPI application entrypoint placeholder."""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API Placeholder")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/mock/search")
def mock_search(query: str = Query(..., min_length=1)) -> dict[str, object]:
    trimmed_query = query.strip()

    if len(trimmed_query) == 0:
        raise HTTPException(status_code=400, detail="검색어를 입력해주세요.")

    return {
        "query": trimmed_query,
        "items": [
            {
                "id": "mock-001",
                "targetName": f"{trimmed_query} 중심 후보지",
                "lotAddress": "서울특별시 중구 세종대로 110",
                "roadAddress": "서울특별시 중구 태평로1가 31",
                "summary": "주요 도로 접근성 양호, 기초 인허가 검토 필요",
                "note": "본 결과는 mock 데이터이며 실제 분석 전 사전 검토용입니다.",
                "longitude": 126.9780,
                "latitude": 37.5665,
            },
            {
                "id": "mock-002",
                "targetName": f"{trimmed_query} 대안 후보지 A",
                "lotAddress": "서울특별시 중구 무교동 45",
                "roadAddress": "서울특별시 중구 무교로 21",
                "summary": "상업시설 인접, 보행 접근성 양호",
                "note": "현장 여건 및 지구단위계획 추가 확인 필요",
                "longitude": 126.9812,
                "latitude": 37.5678,
            },
            {
                "id": "mock-003",
                "targetName": f"{trimmed_query} 대안 후보지 B",
                "lotAddress": "서울특별시 중구 을지로1가 87",
                "roadAddress": "서울특별시 중구 을지로 30",
                "summary": "대중교통 접근성 우수, 혼잡도 검토 필요",
                "note": "토지이용계획 및 규제 중첩 여부 확인 권장",
                "longitude": 126.9841,
                "latitude": 37.5652,
            },
        ],
    }
