import subprocess

files = [
    "建設道具クイズ.pptx",
    "空調衛生用語クイズ.pptx",
    "プラント用語クイズ.pptx",
    "建築用語クイズ.pptx",
    "施工管理用語クイズ.pptx",
    "電気用語クイズ.pptx",
    "土木用語クイズ.pptx",
]

for f in files:
    print(f"処理中: {f}")
    subprocess.run(["python", "scripts/extract_construction_quiz.py", f], check=True)