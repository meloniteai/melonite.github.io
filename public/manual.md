# Melonite product manual

Manual revision: 2026-07-31

Public copy: https://melonite.ai/manual/

## What Melonite does

Melonite supervises coding-agent work. A Work session keeps the person's request, the coding agent, selected rule sets, task-specific watchers, proof, and follow-up prompts together.

## Start and steer work

Create a Work session, choose the project and coding agent, and describe the outcome in the composer. Continue using that same composer to answer questions, correct direction, or add constraints. Melonite coordinates the session; it does not edit the repository itself.

## Rule sets and watchers

A rule set is durable guidance reused across tasks. A watcher applies a narrow check to the current Work session.

Melonite may arm a watcher only from relevant existing rule-set rules. If no rule fits, it may suggest a durable intent rule for the person to approve. Only the person can create a free-form watcher.

To create a watcher yourself, enter this directly in the Work composer and submit it:

`@short-name watch this session for the specific behavior to check`

Example:

`@safe-retry watch this session for a failed retry preserving the original draft`

The name may contain letters, numbers, hyphens, or underscores. The text after `for` is required. The watcher applies only to that session. To stop it, use the disarm control beside the watcher in Rulesets & watchers.

Do not ask the Melonite agent to invent or create a free-form watcher for you. It can explain the composer syntax, list relevant rule sets, and work with rule-set-backed watchers.

## Proof and completion

Proof requirements describe evidence the coding agent should produce, such as test output or a real screenshot. A plan, summary, or claim is not proof. Melonite evaluates new work and evidence at supervised yields. Completion remains unverified until the current work, required proof, and armed checks are clear.

## Prompt Weave

When another coding turn is needed, Prompt Weave combines the current request, accepted guidance, watcher findings, and feedback into an editable follow-up prompt so the person does not have to reconstruct the context.
