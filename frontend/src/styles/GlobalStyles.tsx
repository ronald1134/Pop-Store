import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  :root {
    font-family: 'Segoe UI', sans-serif;
    line-height: 1.5;
    font-weight: 400;
    color: #f8fafc;
    background: #0f172a;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }

  * {
    box-sizing: border-box;
  }

  html, body, #root {
    margin: 0;
    min-height: 100%;
    min-width: 100%;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  }

  body {
    min-height: 100vh;
    color: #f8fafc;
  }

  a {
    text-decoration: none;
  }

  img {
    max-width: 100%;
    display: block;
  }

  section {
    scroll-margin-top: 96px;
  }

  .reveal {
    opacity: 0;
    transform: translateY(24px);
    animation: reveal linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 35%;
  }

  @keyframes reveal {
    from {
      opacity: 0;
      transform: translateY(24px);
      filter: blur(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
      filter: blur(0);
    }
  }

  .grid-motion {
    animation: floatUp 700ms ease-out both;
  }

  @keyframes floatUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`