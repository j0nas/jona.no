import { useRef, useState } from "react";
import { Button, Dialog } from "../../win95";
import styles from "./System.module.css";

interface RunProps {
  onCancel: () => void;
  /** Open what was typed; false when nothing matches (the field stays for another go). */
  onRun: (command: string) => boolean;
}

/** Start › Run: type a program, document or address and Windows opens it. */
export default function Run({ onCancel, onRun }: RunProps) {
  const [command, setCommand] = useState("");
  const input = useRef<HTMLInputElement>(null);

  function submit() {
    if (!command.trim()) return;
    if (onRun(command.trim())) onCancel();
    else input.current?.select();
  }

  return (
    <Dialog title="Run" onClose={onCancel} onSubmit={submit}>
      <div className={styles.run}>
        <div className={styles.runIntro}>
          <img src="/img/win95/run-32.png" alt="" width={32} height={32} />
          <p>Type the name of a program, folder, or document, and Windows will open it for you.</p>
        </div>
        <label className={styles.runField}>
          <span>
            <u>O</u>pen:
          </span>
          <input
            ref={input}
            className={styles.field}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            spellCheck={false}
            type="text"
            autoComplete="off"
          />
        </label>
        <div className={styles.buttons}>
          <Button type="submit" isDefault disabled={!command.trim()}>
            OK
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
          <Button disabled>Browse...</Button>
        </div>
      </div>
    </Dialog>
  );
}
