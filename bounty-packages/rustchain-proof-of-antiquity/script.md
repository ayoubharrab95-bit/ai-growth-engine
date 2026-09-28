# How RustChain Makes Old CPUs Part of Consensus

## 0:00–0:35 — Hook
What if a computer's age could be part of a blockchain consensus system?

RustChain proposes a different idea from familiar proof-of-work and proof-of-stake models: instead of making computation or locked capital the central resource, its Proof-of-Antiquity design uses physical hardware identity and hardware age as part of participation.

The project's central slogan is simple: 1 CPU = 1 Vote.

This video explains what that means according to RustChain's public technical documentation, and why a 2002 PowerPC G4 can be treated differently from a modern processor.

## 0:35–1:25 — The basic idea
RustChain describes itself as a blockchain that rewards vintage and diverse hardware for participating in network consensus.

The reference protocol documentation says the implementation is written in Python, using Flask and SQLite, and describes RIP-200 as a Proof-of-Antiquity consensus mechanism.

The important distinction is that the protocol is not simply asking, “How many hashes can this machine calculate?” Instead, it asks questions about the machine itself: its CPU architecture, hardware age, and hardware identity.

## 1:25–2:20 — What 1 CPU = 1 Vote means
The phrase 1 CPU = 1 Vote should not be read as every CPU receiving exactly the same reward.

RustChain's documentation describes a round-robin attestation model in which hardware identity is combined with antiquity weighting.

The public documentation gives a concrete example: a PowerPC G4 from 2002 is described as earning a 2.5-times base reward.

That example shows the intended philosophy. A machine does not become more valuable because it has more modern computational power. Its historical hardware characteristics are part of what the protocol is trying to preserve and reward.

## 2:20–3:20 — Hardware fingerprinting
The project's Proof-of-Antiquity documentation describes hardware fingerprinting as a key part of the system.

The purpose is to establish a machine identity rather than allowing one physical computer to appear as an unlimited number of independent participants.

RustChain's public documentation also describes anti-emulation checks and hardware fingerprint channels.

This raises a basic question for a physical-machine consensus system: how do you distinguish a real machine from software pretending to be many machines?

The project addresses that problem through hardware-derived identity and anti-emulation logic. That is a design claim, not a guarantee that every possible attack is impossible.

## 3:20–4:20 — Why vintage hardware matters
RustChain's CPU antiquity documentation says older CPUs receive higher mining reward multipliers, with time-based decay described as part of the model.

The project covers architectures including Intel, AMD, PowerPC, Apple Silicon, SPARC, MIPS, Motorola 68K, SuperH, ARM, RISC-V, and game-console CPUs.

Instead of optimizing a network around one dominant class of modern hardware, the protocol is designed to make hardware diversity economically relevant.

## 4:20–5:10 — A concrete example
Imagine two machines: a modern x86 computer and a PowerPC G4 from 2002.

In an ordinary benchmark, you would expect the modern machine to outperform the older one. RustChain is asking a different question.

It is not trying to make the G4 win a benchmark. It is trying to create a consensus and reward system in which proving the existence and participation of historically older hardware has value.

The project's documentation explicitly gives the 2002 PowerPC G4 a 2.5-times base reward multiplier. The reward is therefore tied to the protocol's antiquity model, not to a claim that the old processor is computationally faster.

## 5:10–6:00 — The trade-off
A hardware-based identity system needs reliable attestation. It needs protection against duplicate identities and emulation. It also needs clear rules for how hardware age and architecture translate into rewards.

RustChain's public repository contains specifications and implementation documents for Proof-of-Antiquity, 1-CPU-1-Vote, hardware fingerprinting, fleet detection, and related components.

That documentation lets readers inspect the assumptions instead of treating the concept as a black box.

## 6:00–6:35 — Closing
The interesting idea behind RustChain is not simply “old computers can mine.” It is that hardware history can become part of a network's economic and consensus model.

The project's public documentation describes a system where one CPU corresponds to one participation identity, while antiquity and hardware characteristics influence rewards.

Whether that model works at scale is an empirical question for implementations, measurements, and real-world operation.

But the concept is clear: instead of asking only how much computation a machine can produce, RustChain asks what physical machine it actually is.

End card: RustChain Proof-of-Antiquity + source links + Explore the public specifications.