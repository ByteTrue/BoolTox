import tkinter as tk
import sys


def main():
    root = tk.Tk()
    root.title("Python Standalone Demo")
    root.geometry("420x260")

    label = tk.Label(root, text="Hello from standalone Python GUI", font=("Arial", 12))
    label.pack(pady=12)

    status = tk.StringVar(value="Ready")

    def on_click():
        status.set("Button clicked")

    btn = tk.Button(root, text="Click", command=on_click)
    btn.pack(pady=8)

    status_label = tk.Label(root, textvariable=status)
    status_label.pack(pady=8)

    print("Standalone GUI started", flush=True)
    root.protocol("WM_DELETE_WINDOW", root.destroy)
    root.mainloop()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
