import os
import base64
import requests
from flask import Flask, request, jsonify
import google.generativeai as genai
from dotenv import load_dotenv
import re
import io
import fitz  # PyMuPDF
from flasgger import Swagger, swag_from

# .env 파일 자동 로드
load_dotenv()

app = Flask(__name__)
swagger = Swagger(app,
    template={
        "swagger": "2.0",
        "info": {
            "title": "AI API",
        },
        "host": "localhost:5042",
        "basePath": "/",
        "schemes": ["http"]
    },
    config={
        'headers': [],
        'specs': [
            {
                'endpoint': 'apispec_1',
                'route': '/apispec_1.json',
                'rule_filter': lambda rule: True,
                'model_filter': lambda tag: True,
            }
        ],
        'static_url_path': '/flasgger_static',
        'swagger_ui': True,
        'specs_route': '/apidocs/'
    }
)

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
model = genai.GenerativeModel("gemini-2.0-flash")
API_URL = os.environ.get('API_URL')
SERVER_PORT = int(os.environ.get('SERVER_PORT'))

def get_base64_image(image_url):
    # 상대경로면 절대 URL로 보정
    if image_url.startswith('/'):
        image_url = API_URL + image_url
    try:
        print(f"[DEBUG] Downloading image: {image_url}")
        response = requests.get(image_url)
        response.raise_for_status()
        return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        print(f"[ERROR] Image download failed: {e}")
        return None

def get_base64_images(image_urls):
    b64s = []
    for url in image_urls:
        b64 = get_base64_image(url)
        if b64:
            b64s.append(b64)
    return b64s

def get_base64_pdf(pdf_url):
    # 상대경로면 절대 URL로 보정
    if pdf_url.startswith('/'):
        pdf_url = API_URL + pdf_url
    try:
        print(f"[DEBUG] Downloading PDF: {pdf_url}")
        response = requests.get(pdf_url)
        response.raise_for_status()
        pdf_bytes = response.content

        # PDF를 이미지로 변환 (PyMuPDF 사용)
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
        b64s = []

        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            # 높은 해상도로 렌더링 (2배 확대)
            mat = fitz.Matrix(2.0, 2.0)
            pix = page.get_pixmap(matrix=mat)

            # 이미지 데이터를 JPEG로 변환
            img_data = pix.tobytes("jpeg")
            b64 = base64.b64encode(img_data).decode('utf-8')
            b64s.append(b64)
            print(f"[DEBUG] Converted PDF page {page_num+1} to image")

        pdf_document.close()

        return b64s
    except Exception as e:
        print(f"[ERROR] PDF download or conversion failed: {e}")
        return None

def get_summary(note_text, image_urls=None, pdf_url=None):
    summary_prompt = (
"""
[역할]
당신은 복잡한 전공 지식을 명확하고 구조적으로 정리하는 기술 블로거(Technical Blogger)입니다.

[목표]
아래 [자료]를 바탕으로, 독자들이 개념을 쉽게 이해하고 참고할 수 있는 고품질의 기술 요약 문서를 작성합니다. 이 문서는 노션(Notion)이나 기술 블로그에 바로 게시할 수 있는 수준이어야 합니다.

[작성 규칙]
1.  **제목 생성**: 문서의 가장 첫 줄에는 **반드시 '## \{title\} 핵심 요약' 형식의 제목**을 추가하세요. {title} 부분은 [자료]의 핵심 주제로 직접 판단하여 채워주세요.
2.  **분량**: 요약 내용은 **최소 20줄 이상**으로 작성하여 핵심 내용을 충분히 다뤄주세요. 이미지 분량에 맞게 답변을 늘려주셔도 됩니다. 너무 길지 않게 조절하세요.
3.  **내용 보강 및 레퍼런스**: [자료]의 내용이 부족하거나 수식, 내용이 맥락상 오류가 있다면, 정확한 정보를 추가하여 내용을 보강할 수 있습니다. 중요한 내용을 보강했다면, 신뢰할 수 있는 논문이나 공식 문서 링크를 레퍼런스로 제시하세요.
4.  **언어**: 본문은 한국어로 작성하되, 코드나 전공 용어(예: `Garbage Collection`, `Semaphore`)는 원어(영어)를 그대로 사용하세요.
5.  **수식**: 수학적 표현, Symbol이 들어간 공식, 함수 식, 행렬, 점화식, 수식은 **TeX 문법**을 사용하여 앞 뒤로 $ 기호를 붙여 작성하세요.
6.  **출력 형식**: 최종 결과물은 **마크다운(Markdown) 형식**으로만 반환하세요. 마크다운 응답 앞뒤에 ```markdown, ``` 등 코드블럭 문법을 붙이지 마세요.
"""
+
"""
[자료]
{note_text}
"""
    )
    contents = [summary_prompt]
    if image_urls:
        b64s = get_base64_images(image_urls)
        for b64 in b64s:
            contents.append({"mime_type": "image/png", "data": b64})
    elif pdf_url:
        b64s = get_base64_pdf(pdf_url)
        if not b64s:
            return None
        for b64 in b64s:
            contents.append({"mime_type": "image/jpeg", "data": b64})
    else:
        return None
    response = model.generate_content(contents)
    return response.text.strip()

def extract_json_array(text):
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        return match.group(0)
    return None

def get_quiz(note_text, image_urls=None, pdf_url=None):
    quiz_prompt = (
        """
[역할]
당신은 주어진 컴퓨터 공학 지식을 분석하여, 맞춤형 객관식 퀴즈를 생성하는 AI 튜터입니다.

[목표]
아래 [강의 필기 내용]을 읽고, 내용의 핵심 주제를 스스로 판단하여 가장 적합한 유형의 객관식 퀴즈 5개를 생성합니다.

[강의 필기 내용]
{note_text}

[핵심 생성 원칙 및 지침]
당신의 최우선 임무는 아래 지침에 따라 문제 유형을 결정하고, 그에 맞는 퀴즈를 생성하는 것입니다. 이 지침을 반드시 따르세요.

**1단계: 내용 분석 및 유형 분류**
먼저 [강의 필기 내용]에서 핵심 키워드를 찾고, 아래 두 가지 유형 중 하나로 내용을 분류합니다.

*   **유형 A (코딩/알고리즘):** 내용에 `알고리즘`, `자료구조`, `실습`, `정렬`, `탐색`, `재귀`, `클래스`, `객체`, `함수`, `포인터`, `C++`, `Java`, `Python` 등의 키워드가 주로 포함된 경우.
*   **유형 B (컴퓨터 공학 이론):** 내용에 `운영체제(OS)`, `세마포어`, `뮤텍스`, `데드락`, `데이터베이스(DB)`, `정규화`, `트랜잭션`, `네트워크`, `TCP/IP`, `OSI 7계층` 등의 키워드가 주로 포함된 경우.

**2단계: 분류된 유형에 따른 규칙 적용**
분류 결과에 따라 아래 규칙 중 하나를 선택하여 퀴즈를 생성합니다.

*   **규칙 A (유형 A로 분류된 경우):**
    *   **반드시 C, C++, Python, Java 코드를 포함한 문제**를 생성해야 합니다.
    *   실행 결과 예측, 코드 빈칸 채우기, 버그 찾기 등 다양한 코드 관련 문제를 출제하세요.
    *   코드는 반드시 코드 블럭 문법으로 제공해야 합니다. 해당 조건을 무시할 수 없습니다.
    *   코드 블럭 문법은 반드시 ```cpp, ```python, ```java, ```c 중 하나로 시작해야 합니다.
    *   수식, 정의, 함수 식, 점화식 등 수학적 개념은 반드시 $ 기호를 앞 뒤로 작성하는 TeX 문법으로 작성해야 합니다.

*   **규칙 B (유형 B로 분류된 경우):**
    *   **절대 코드를 포함하지 않는 순수 개념 확인 문제**를 생성해야 합니다.
    *   용어의 정의, 개념 간의 비교, 특정 프로세스의 순서 등을 질문하세요.
    *   수식, 정의, 함수 식, 점화식 등 수학적 개념은 반드시 $ 기호를 앞 뒤로 작성하는 TeX 문법으로 작성해야 합니다.

**3단계: 공통 규칙 및 예외 처리**
1.  **JSON 형식:** 전체 결과는 반드시 유효한 JSON 배열 형식이어야 합니다.
2.  **JSON 구조:** 각 퀴즈는 `question`, `options`(5개), `answerIndex`(0-4), `explanation` 키를 포함해야 합니다.
3.  **혼합 콘텐츠 처리:** 만약 내용이 모호하거나 유형 A와 B가 섞여 있어 판단이 어렵다면, 더 안전하고 간단한 **규칙 B (이론 문제)**를 우선적으로 따르세요.
4.  **유연한 개수 조절:** 만약 5개의 고유한 퀴즈 생성이 어렵다면, 생성 가능한 만큼이라도 (예: 3~4개) **반드시 생성하여 반환**하세요. **절대로 빈 배열을 반환해서는 안 됩니다.**

[완성본 예시]
당신이 생성할 결과는 아래 예시와 완전히 동일한 구조를 가져야 합니다.
[
    {
        "question": "다음은 너비 우선 탐색(BFS)을 C++로 구현한 코드입니다. 주어진 그래프에서 노드 1에서 5까지의 최단 거리는 얼마인가요?\n\n``````",
        "options": ["1", "2", "3", "4", "경로 없음"],
        "answerIndex": 1,
        "explanation": "BFS는 최단 경로를 보장하며, 1 -> 2 -> 5 경로는 길이가 2입니다."
    },
    {
        "question": "데이터베이스 정규화 과정에서, 테이블의 모든 속성 값이 원자(atomic) 값을 갖도록 하는 단계는 무엇인가요?",
        "options": ["제1정규형(1NF)", "제2정규형(2NF)", "제3정규형(3NF)", "BCNF", "비정규형"],
        "answerIndex": 0,
        "explanation": "제1정규형(1NF)은 모든 컬럼의 값이 더 이상 분해할 수 없는 원자 값이어야 한다는 규칙입니다."
    }
]

"""
    )
    # quiz_prompt = (
    #     "[역할] 당신은 컴퓨터공학부 대학생의 시험 대비를 돕는 AI 튜터입니다.\n"
    #     "[목표] 아래 강의 필기 자료를 바탕으로, 개념을 정리할 수 있는 객관식 퀴즈 5문제를 만들어 주세요.\n"
    #     " - 퀴즈의 질문은 무조건 의문문 이어야 하며, 코드를 제시하고 해당 코드의 결과나 개념에 묻는 질문이어야 합니다.\n"
    #     " - 이를 위해 코드를 생성해서 제공해야 하며, 코드의 일부분을 문제로 물어봐야 합니다. (ex. 실행 결과로 옳은 것은?)\n"
    #     " - 코드를 제시할때는 **반드시**!!!! 코드 블럭 문법으로 제공해야 합니다. 해당 조건을 무시할 수 없습니다.\n"
    #     " - 학부에서 다루는 언어는 주로 C, C++, Python, Java 입니다.\n"

    #     " - 아래는 [문제내용]의 예시입니다. \n"
    #     " 문제: 다음은 c++로 구현한 BFS 알고리즘 코드이다. 입력에 따른 출력 결과로 옳은 것은?\n"
    #     "```cpp\n"
    #     "int solve(int n, int m, vector<vector<int>> edges) {\n"
    #     "  queue<int> q;\n"
    #     "  q.push(1);\n"
    #     "  while (!q.empty()) {\n"
    #     "    int u = q.front();\n"
    #     "    q.pop();\n"
    #     "    for (int v : edges[u]) {\n"
    #     "      if (dist[v] == -1) {\n"
    #     "        dist[v] = dist[u] + 1;\n"
    #     "        q.push(v);\n"
    #     "      }\n"
    #     "    }\n"
    #     "  }\n"
    #     "  return dist[n];\n"
    #     "}\n"
    #     "```\n"

    #     " 입력: n = 5, m = 6, edges = [[1, 2], [1, 3], [2, 4], [2, 5], [3, 4], [3, 5]]\n"
    #     " 선택지: 1. 2, 2. 3, 3. 4, 4. 5, 5. 6\n"
    #     " 정답: 1\n"
    #     " 해설: 1번 노드에서 2번 노드로 가는 최단 경로는 1번 -> 2번 이며, 이 경로의 길이는 1입니다.\n"
    #     "- 각 문제는 5개의 선택지와 정답 인덱스(0~4), 그리고 간략한 해설(explanation)을 포함해야 합니다.\n"
    #     "- JSON 배열 형식으로 반환해 주세요.\n"
    #     "예시:\n"
    #     "[\n  {\n    \"question\": \"문제 내용\",\n    \"options\": [\"선택지1\", \"선택지2\", \"선택지3\", \"선택지4\", \"선택지5\"],\n    \"answerIndex\": 2,\n    \"explanation\": \"정답에 대한 간단한 해설\"\n  }\n]\n"
    # )
    contents = [quiz_prompt]
    if note_text:
        contents.append(note_text)
    if image_urls:
        b64s = get_base64_images(image_urls)
        for b64 in b64s:
            contents.append({"mime_type": "image/png", "data": b64})
    elif pdf_url:
        b64s = get_base64_pdf(pdf_url)
        if not b64s:
            return []
        for b64 in b64s:
            contents.append({"mime_type": "image/jpeg", "data": b64})
    else:
        return []
    response = model.generate_content(contents)
    import json
    json_str = extract_json_array(response.text)
    try:
        quiz_list = json.loads(json_str) if json_str else []
    except Exception:
        quiz_list = []
    return quiz_list

@app.route('/generate', methods=['POST'])
@swag_from({
    'tags': ['AI Generation'],
    'summary': '노트 내용을 바탕으로 요약 및 퀴즈 생성',
    'description': '손글씨 노트의 텍스트, 이미지, PDF를 분석하여 AI 요약과 퀴즈를 생성합니다.',
    'parameters': [
        {
            'name': 'noteId',
            'in': 'body',
            'required': True,
            'schema': {
                'type': 'object',
                'properties': {
                    'noteId': {'type': 'integer'},
                    'title': {'type': 'string'},
                    'keywords': {'type': 'array', 'items': {'type': 'string'}},
                    'description': {'type': 'string'},
                    'imageUrls': {'type': 'array', 'items': {'type': 'string'}},
                    'pdfUrl': {'type': 'string'}
                }
            }
        }
    ],
    'responses': {
        200: {
            'description': '성공적으로 요약 및 퀴즈 생성',
            'schema': {
                'type': 'object',
                'properties': {
                    'content': {'type': 'string'},
                    'quiz': {'type': 'array'}
                }
            }
        },
        400: {'description': '잘못된 요청'},
        500: {'description': '서버 오류'}
    }
})
def generate():
    data = request.json
    note_text = data.get('description', '')
    image_urls = data.get('imageUrls', [])
    pdf_url = data.get('pdfUrl', None)
    if image_urls:
        summary = get_summary(note_text, image_urls=image_urls)
        quiz = get_quiz(summary, image_urls=image_urls)
    elif pdf_url:
        summary = get_summary(note_text, pdf_url=pdf_url)
        quiz = get_quiz(summary, pdf_url=pdf_url)
    else:
        return jsonify({'error': 'imageUrls or pdfUrl is required'}), 400
    if summary is None or quiz is None:
        return jsonify({'error': 'Image download or conversion failed'}), 400

    print("summary: ", summary)
    print("quiz: ", quiz)

    return jsonify({
        'content': summary,
        'quiz': quiz
    })

@app.route('/api/ai/quiz/generate', methods=['POST'])
def api_generate_quiz():
    data = request.json
    note_text = data.get('note_text', '')
    image_urls = data.get('imageUrls', [])
    pdf_url = data.get('pdfUrl', None)
    quiz = get_quiz(note_text, image_urls=image_urls, pdf_url=pdf_url)
    print("quiz: ", quiz)
    if quiz is None:
        return jsonify({'error': '퀴즈 생성 실패'}), 400
    return jsonify({'quiz': quiz})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=SERVER_PORT)
