from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


OUTPUT_NAME = "repomix-output.xml"


def run_command(args: list[str], cwd: Path) -> str:
    result = subprocess.run(
        args,
        cwd=cwd,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout


def list_repo_files(repo_root: Path) -> list[str]:
    tracked = run_command(["git", "ls-files"], cwd=repo_root).splitlines()
    untracked = run_command(
        ["git", "ls-files", "--others", "--exclude-standard"],
        cwd=repo_root,
    ).splitlines()
    return sorted({path for path in tracked + untracked if path.strip()})


def copy_repo_files(repo_root: Path, export_root: Path) -> None:
    for relative_path in list_repo_files(repo_root):
        source_path = repo_root / relative_path
        if not source_path.is_file():
            continue

        destination_path = export_root / relative_path
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_path, destination_path)


def count_packed_files(output_path: Path) -> int:
    return output_path.read_text(encoding="utf-8").count('<file path="')


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    export_root = Path(tempfile.gettempdir()) / "repomix-safe-export"
    output_path = export_root / OUTPUT_NAME
    repo_output_path = repo_root / OUTPUT_NAME

    if export_root.exists():
        shutil.rmtree(export_root)
    export_root.mkdir(parents=True, exist_ok=True)

    copy_repo_files(repo_root, export_root)

    repomix_cmd = ["npx.cmd", "repomix", "--output", OUTPUT_NAME, "--quiet"]
    if os.name != "nt":
        repomix_cmd[0] = "npx"

    subprocess.run(repomix_cmd, cwd=export_root, check=True)
    shutil.copy2(output_path, repo_output_path)

    packed_count = count_packed_files(output_path)
    print(f"Repomix generado en: {repo_output_path}")
    print(f"Archivos empaquetados: {packed_count}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        if exc.stdout:
            sys.stdout.write(exc.stdout)
        if exc.stderr:
            sys.stderr.write(exc.stderr)
        raise
