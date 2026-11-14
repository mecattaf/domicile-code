# Working in Domicile Code

This is currently a documentation-only scope for a bounded experiment. Preserve the complete workbench-as-shell ambition and the first end-to-end acceptance in SCOPE.md. Work is scoped with the human before implementation begins.

Read README.md, SCOPE.md and docs/upstream.md before proposing changes. Keep source findings, measured runtime behavior, integration questions and proposals distinct. Record exact engine, shell and dependency revisions with runtime claims.

Build and test on the designated compute host. Temporary experiments and worktrees belong under /tmp. Before a Nix build, check free space on the actual builder and stop below 25 GB. Runtime-sensitive tests and test compositors use ~/.local/bin/runtime-test on the target host, or a disposable environment. Do not run experiments against unrelated live desktop sessions or restart the user manager to repair them.

Demonstrate one behavior at a time through the shared human/agent prototype desktop. A successful tool call does not establish the intended visible result. Retain failure evidence and explicit missing observations. Finalize recordings and check that they play before presenting them as demos.

Use public-safe fixture content in evidence. Keep local provider/account inventories, credentials, private chats, personal files and private product strategy outside this public repository and exported recordings.

Implement workbench-specific behavior here. For upstream Domicile changes, first reduce the behavior and establish why the contract is reusable. Do not describe the investigation questions as confirmed bugs or maintainer commitments.

Push branches at stopping points so temporary checkouts never hold the only copy of work. Do not build a synchronization tool or schedule for that habit. Publication of clips or messages to maintainers is a separate action from preparing them.
