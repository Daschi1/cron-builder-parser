<script lang="ts">
  export let title: string | undefined = undefined;
</script>

<span aria-hidden="true" class="fancy-heart" {title}>♥️</span>

<style>
  .fancy-heart {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding: 0 0.05rem;
    border-radius: 0.25rem;
    color: #ef4444; /* tailwind rose-500-ish on dark */
    transition:
      color 200ms ease,
      text-shadow 200ms ease,
      transform 200ms ease;
    outline: none;
  }

  /* Self hover/focus (if placed inside a focusable element) */
  .fancy-heart:hover,
  .fancy-heart:focus-visible {
    color: #fb7185; /* a bit brighter */
    text-shadow:
      0 0 10px rgba(251, 113, 133, 0.6),
      0 0 18px rgba(244, 63, 94, 0.4);
    animation: heart-beat 900ms ease-in-out infinite;
  }

  /* Activate when the whole love line is hovered or focused (keyboard focus within) */
  /* This is used in the footer */
  /*noinspection CssUnusedSymbol*/
  :global(.love-line:hover) .fancy-heart,
  :global(.love-line:focus-within) .fancy-heart {
    color: #fb7185; /* a bit brighter */
    text-shadow:
      0 0 10px rgba(251, 113, 133, 0.6),
      0 0 18px rgba(244, 63, 94, 0.4);
    animation: heart-beat 900ms ease-in-out infinite;
  }

  /* Sparkles */
  .fancy-heart::before,
  .fancy-heart::after {
    content: "✨";
    position: absolute;
    font-size: 0.8em;
    opacity: 0;
    filter: drop-shadow(0 0 6px rgba(250, 204, 21, 0.6));
    pointer-events: none;
  }
  .fancy-heart::before {
    left: -0.5rem;
    top: -0.35rem;
  }
  .fancy-heart::after {
    right: -0.55rem;
    top: -0.2rem;
  }

  .fancy-heart:hover::before,
  .fancy-heart:focus-visible::before {
    animation: sparkle-pop-left 900ms ease-out forwards;
  }
  .fancy-heart:hover::after,
  .fancy-heart:focus-visible::after {
    animation: sparkle-pop-right 900ms ease-out forwards;
    animation-delay: 120ms;
  }

  @keyframes heart-beat {
    0%,
    100% {
      transform: scale(1);
    }
    20% {
      transform: scale(1.18);
    }
    35% {
      transform: scale(0.96);
    }
    55% {
      transform: scale(1.12);
    }
    75% {
      transform: scale(0.99);
    }
  }
  @keyframes sparkle-pop-left {
    0% {
      transform: translate(0, 0) rotate(-8deg) scale(0.6);
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    60% {
      transform: translate(-4px, -10px) rotate(-18deg) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-8px, -18px) rotate(-28deg) scale(0.8);
      opacity: 0;
    }
  }
  @keyframes sparkle-pop-right {
    0% {
      transform: translate(0, 0) rotate(8deg) scale(0.6);
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    60% {
      transform: translate(4px, -10px) rotate(18deg) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(8px, -18px) rotate(28deg) scale(0.8);
      opacity: 0;
    }
  }

  /* Be kind to folks with motion sensitivity */
  @media (prefers-reduced-motion: reduce) {
    .fancy-heart,
    .fancy-heart::before,
    .fancy-heart::after {
      animation: none !important;
      transition: none !important;
    }
    .fancy-heart:hover,
    .fancy-heart:focus-visible {
      text-shadow: none;
    }
  }
</style>
