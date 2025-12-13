#!/usr/bin/env python3
"""
Copyright (c) 2025 ByteTrue
Licensed under CC-BY-NC-4.0

任务管理器 - 交互式 TUI 示例
演示如何将交互式 CLI 工具集成到 BoolTox（零改造）
"""

from prompt_toolkit import prompt
from prompt_toolkit.completion import WordCompleter
from prompt_toolkit.formatted_text import HTML
import json
import os
from datetime import datetime

# 数据存储文件
DATA_FILE = os.path.expanduser('~/.booltox-todo.json')

def load_tasks():
    """加载任务列表"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_tasks(tasks):
    """保存任务列表"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

def print_header():
    """打印欢迎界面"""
    print("\n" + "=" * 60)
    print("  📝 任务管理器 - BoolTox CLI 工具")
    print("=" * 60)
    print()

def print_help():
    """打印帮助信息"""
    print("📋 可用命令:")
    print("  add <任务内容>       - 添加新任务")
    print("  list                 - 列出所有任务")
    print("  done <任务ID>        - 标记任务为已完成")
    print("  delete <任务ID>      - 删除任务")
    print("  clear                - 清除已完成的任务")
    print("  stats                - 显示统计信息")
    print("  help                 - 显示此帮助")
    print("  exit / quit          - 退出程序")
    print()

def cmd_add(args):
    """添加任务"""
    if not args:
        print("❌ 请输入任务内容")
        return

    task_text = ' '.join(args)
    tasks = load_tasks()
    new_task = {
        'id': len(tasks) + 1,
        'task': task_text,
        'done': False,
        'created_at': datetime.now().isoformat()
    }
    tasks.append(new_task)
    save_tasks(tasks)
    print(f"✅ 任务已添加: {task_text} (ID: {new_task['id']})")

def cmd_list(args):
    """列出任务"""
    tasks = load_tasks()
    if not tasks:
        print("📭 暂无任务")
        return

    print(f"\n📋 任务列表（共 {len(tasks)} 项）:\n")
    for task in tasks:
        status = '✓' if task['done'] else '○'
        print(f"  [{status}] {task['id']}. {task['task']}")
        if task['done']:
            print(f"      （已完成于: {task.get('completed_at', '未知')[:10]}）")
    print()

def cmd_done(args):
    """标记完成"""
    if not args:
        print("❌ 请输入任务 ID")
        return

    try:
        task_id = int(args[0])
        tasks = load_tasks()

        for task in tasks:
            if task['id'] == task_id:
                task['done'] = True
                task['completed_at'] = datetime.now().isoformat()
                save_tasks(tasks)
                print(f"✅ 任务 #{task_id} 已完成！")
                return

        print(f"❌ 未找到任务 #{task_id}")
    except ValueError:
        print("❌ 任务 ID 必须是数字")

def cmd_delete(args):
    """删除任务"""
    if not args:
        print("❌ 请输入任务 ID")
        return

    try:
        task_id = int(args[0])
        tasks = load_tasks()

        for i, task in enumerate(tasks):
            if task['id'] == task_id:
                tasks.pop(i)
                save_tasks(tasks)
                print(f"🗑️  任务 #{task_id} 已删除")
                return

        print(f"❌ 未找到任务 #{task_id}")
    except ValueError:
        print("❌ 任务 ID 必须是数字")

def cmd_clear(args):
    """清除已完成任务"""
    tasks = load_tasks()
    before = len(tasks)
    tasks = [t for t in tasks if not t['done']]
    save_tasks(tasks)

    cleared = before - len(tasks)
    if cleared > 0:
        print(f"✅ 已清除 {cleared} 个已完成任务")
    else:
        print("📭 没有已完成的任务需要清除")

def cmd_stats(args):
    """显示统计"""
    tasks = load_tasks()
    if not tasks:
        print("📭 暂无任务")
        return

    total = len(tasks)
    done = sum(1 for t in tasks if t['done'])
    pending = total - done

    print("\n📊 任务统计:")
    print(f"  总任务数: {total}")
    print(f"  已完成: {done}")
    print(f"  待完成: {pending}")
    if total > 0:
        print(f"  完成率: {done / total * 100:.1f}%")
    print()

# 命令映射
COMMANDS = {
    'add': cmd_add,
    'list': cmd_list,
    'ls': cmd_list,
    'done': cmd_done,
    'delete': cmd_delete,
    'del': cmd_delete,
    'clear': cmd_clear,
    'stats': cmd_stats,
    'help': lambda _: print_help(),
}

def main():
    """主循环"""
    print_header()
    print("💡 输入 'help' 查看可用命令\n")

    # 命令补全
    command_completer = WordCompleter(
        list(COMMANDS.keys()) + ['exit', 'quit'],
        ignore_case=True
    )

    while True:
        try:
            # 交互式提示符
            user_input = prompt(
                HTML('<ansicyan><b>todo></b></ansicyan> '),
                completer=command_completer
            ).strip()

            if not user_input:
                continue

            # 解析命令
            parts = user_input.split()
            cmd = parts[0].lower()
            args = parts[1:]

            # 退出命令
            if cmd in ('exit', 'quit'):
                print("\n👋 再见！")
                break

            # 执行命令
            if cmd in COMMANDS:
                COMMANDS[cmd](args)
            else:
                print(f"❌ 未知命令: {cmd}")
                print("💡 输入 'help' 查看可用命令")

        except KeyboardInterrupt:
            print("\n\n👋 按 Ctrl+C 退出，或输入 'exit'")
            continue
        except EOFError:
            print("\n\n👋 再见！")
            break
        except Exception as e:
            print(f"❌ 错误: {e}")

if __name__ == '__main__':
    main()
