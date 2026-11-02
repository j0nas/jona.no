// The review layer on a private page (worker/private.ts), which the Worker adds to the page only
// for whoever signed in with the page's review password. A tab on the right edge offers two
// modes: edit the page in place (edit.js), or leave a note for whoever makes it (comment.js).

import { sendUnsent, startComment } from "./comment.js";
import { startEditing } from "./edit.js";
import { $ } from "./ui.js";

$(".tab .edit").addEventListener("click", startEditing);
$(".tab .comment").addEventListener("click", startComment);
sendUnsent();
