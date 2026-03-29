from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


CACHE_DIR = Path(__file__).resolve().parents[2] / "cache"
CORPUS_PATH = CACHE_DIR / "semantic_corpus.json"


def _build_default_combination_text_library() -> Dict[str, str]:
    scenario_text_library: Dict[str, str] = {
        "biscuit-theft": "厨房里小男孩踩在凳子上伸手去拿高处的饼干，妹妹在旁边仰着头看。妈妈在水槽前洗碗，没有注意到身后发生的事情。男孩不小心把饼干盒碰歪，几块饼干掉在地上，水槽里的水也快要溢出来了。",
        "outdoor-picnic": "一家人在草地上铺开野餐垫，篮子里有水果、面包和饮料。孩子在旁边追逐风筝，父母一边准备食物一边提醒注意安全。天空很亮，周围还有树荫和步道，大家准备在午后一起休息聊天。",
        "ham-fried-rice": "先把米饭提前打散，锅热后放少量油，加入鸡蛋炒成小块盛出。再下火腿肠丁和胡萝卜粒翻炒，倒入米饭快速翻匀，加入盐和少量生抽调味，最后把鸡蛋回锅，撒上葱花后出锅。",
        "making-dumplings": "先把肉馅和蔬菜搅拌均匀，加盐、酱油和香油调味。把面皮放在手心，放入适量馅料，对折后从中间向两边捏紧。锅中水开后下饺子，煮到浮起再点一次冷水，重复后即可捞出食用。",
        "market-shopping": "出门前先列清单，确定要买的蔬菜、肉类和调料。到菜市场先看新鲜度和价格，再按分量挑选。买完后分类装袋，回家及时清洗和冷藏，容易坏的食材优先处理，避免浪费。",
        "boy-who-cried-wolf": "放羊的孩子为了好玩多次大喊狼来了，村民每次都急忙上山帮忙，结果发现是恶作剧。后来真正有狼出现时，孩子再呼救却没人相信，羊群被叼走，他也因此明白了说谎会失去信任。",
        "tortoise-and-hare": "兔子和乌龟比赛跑步，兔子觉得自己速度快，中途在树下睡觉。乌龟虽然慢，却一直不停地往前走。等兔子醒来再追时已经来不及，乌龟先到终点，说明坚持比轻敌更重要。",
        "crow-drinks-water": "乌鸦口渴时发现瓶子里有水，但水位太低够不到。它不停观察后叼来小石子，一颗颗放进瓶子里，水面慢慢升高，最后成功喝到水。这个故事强调遇到问题要动脑筋想办法。",
    }

    mapping: Dict[str, str] = {}
    classes_by_group = {
        "youth": ["youth-general"],
        "elderly": ["elderly-good", "elderly-medium", "elderly-challenged"],
    }
    task_map = {
        "picture": ["biscuit-theft", "outdoor-picnic"],
        "process": ["ham-fried-rice", "making-dumplings", "market-shopping"],
        "story": ["boy-who-cried-wolf", "tortoise-and-hare", "crow-drinks-water"],
    }

    for group, classes in classes_by_group.items():
        for cls in classes:
            for task_type, scenario_ids in task_map.items():
                for scenario_id in scenario_ids:
                    key = f"{group}::{cls}::{task_type}::{scenario_id}"
                    mapping[key] = scenario_text_library[scenario_id]
    return mapping

DEFAULT_CORPUS: Dict[str, Any] = {
    "group_options": [
        {"id": "youth", "label": "青年组"},
        {"id": "elderly", "label": "老年组"},
    ],
    "group_class_options": {
        "youth": [{"id": "youth-general", "label": "不区分"}],
        "elderly": [
            {"id": "elderly-good", "label": "发音良好"},
            {"id": "elderly-medium", "label": "发音一般"},
            {"id": "elderly-challenged", "label": "发音较差"},
        ],
    },
    "task_type_options": [
        {
            "id": "picture",
            "label": "图片描述",
            "scenarios": [
                {"id": "biscuit-theft", "label": "饼干失窃"},
                {"id": "outdoor-picnic", "label": "户外野餐"},
            ],
        },
        {
            "id": "process",
            "label": "流程讲述",
            "scenarios": [
                {"id": "ham-fried-rice", "label": "火腿肠蛋炒饭"},
                {"id": "making-dumplings", "label": "包饺子"},
                {"id": "market-shopping", "label": "去菜市场买菜"},
            ],
        },
        {
            "id": "story",
            "label": "故事叙述",
            "scenarios": [
                {"id": "boy-who-cried-wolf", "label": "狼来了"},
                {"id": "tortoise-and-hare", "label": "龟兔赛跑"},
                {"id": "crow-drinks-water", "label": "乌鸦喝水"},
            ],
        },
    ],
    "scenario_text_library": {
        "biscuit-theft": "厨房里小男孩踩在凳子上伸手去拿高处的饼干，妹妹在旁边仰着头看。妈妈在水槽前洗碗，没有注意到身后发生的事情。男孩不小心把饼干盒碰歪，几块饼干掉在地上，水槽里的水也快要溢出来了。",
        "outdoor-picnic": "一家人在草地上铺开野餐垫，篮子里有水果、面包和饮料。孩子在旁边追逐风筝，父母一边准备食物一边提醒注意安全。天空很亮，周围还有树荫和步道，大家准备在午后一起休息聊天。",
        "ham-fried-rice": "先把米饭提前打散，锅热后放少量油，加入鸡蛋炒成小块盛出。再下火腿肠丁和胡萝卜粒翻炒，倒入米饭快速翻匀，加入盐和少量生抽调味，最后把鸡蛋回锅，撒上葱花后出锅。",
        "making-dumplings": "先把肉馅和蔬菜搅拌均匀，加盐、酱油和香油调味。把面皮放在手心，放入适量馅料，对折后从中间向两边捏紧。锅中水开后下饺子，煮到浮起再点一次冷水，重复后即可捞出食用。",
        "market-shopping": "出门前先列清单，确定要买的蔬菜、肉类和调料。到菜市场先看新鲜度和价格，再按分量挑选。买完后分类装袋，回家及时清洗和冷藏，容易坏的食材优先处理，避免浪费。",
        "boy-who-cried-wolf": "放羊的孩子为了好玩多次大喊狼来了，村民每次都急忙上山帮忙，结果发现是恶作剧。后来真正有狼出现时，孩子再呼救却没人相信，羊群被叼走，他也因此明白了说谎会失去信任。",
        "tortoise-and-hare": "兔子和乌龟比赛跑步，兔子觉得自己速度快，中途在树下睡觉。乌龟虽然慢，却一直不停地往前走。等兔子醒来再追时已经来不及，乌龟先到终点，说明坚持比轻敌更重要。",
        "crow-drinks-water": "乌鸦口渴时发现瓶子里有水，但水位太低够不到。它不停观察后叼来小石子，一颗颗放进瓶子里，水面慢慢升高，最后成功喝到水。这个故事强调遇到问题要动脑筋想办法。",
    },
    "combination_text_library": _build_default_combination_text_library(),
    "class_style_library": {
        "youth-general": "青年组语料不区分发音层级，整体表达节奏较快、语句组织较完整。",
        "elderly-good": "表达较为稳定，停顿较少，词语选择相对准确，整体连贯。",
        "elderly-medium": "表达过程中存在少量停顿和重复，需要一定时间组织语句。",
        "elderly-challenged": "表达中停顿与重复更明显，句子长度较短，信息组织相对松散。",
    },
}


def _read_corpus_file() -> Dict[str, Any]:
    if not CORPUS_PATH.exists():
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        CORPUS_PATH.write_text(
            json.dumps(DEFAULT_CORPUS, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        return dict(DEFAULT_CORPUS)

    try:
        payload = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
        if isinstance(payload, dict):
            if "combination_text_library" not in payload:
                upgraded = dict(payload)
                upgraded["combination_text_library"] = _build_default_combination_text_library()
                CORPUS_PATH.write_text(
                    json.dumps(upgraded, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                return upgraded
            return payload
    except Exception:
        pass
    return dict(DEFAULT_CORPUS)


def load_semantic_corpus() -> Dict[str, Any]:
    payload = _read_corpus_file()
    merged: Dict[str, Any] = dict(DEFAULT_CORPUS)
    for key in (
        "group_options",
        "group_class_options",
        "task_type_options",
        "scenario_text_library",
        "combination_text_library",
        "class_style_library",
    ):
        value = payload.get(key)
        if value is not None:
            merged[key] = value

    merged["storage_path"] = str(CORPUS_PATH.resolve())
    return merged
