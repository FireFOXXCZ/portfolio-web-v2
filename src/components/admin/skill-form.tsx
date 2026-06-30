'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2 } from 'lucide-react'
import type { Skill } from '@/lib/supabase/type'
import { createSkill, updateSkill } from '@/app/[locale]/admin/(protected)/skills/actions'

// Populární technologie / nástroje jako presety
const SKILL_PRESETS: { label: string; slug: string; color: string; category: string; description_cs: string; description_en: string }[] = [
  // ── Frontend frameworks & libraries
  { label: 'Next.js',        slug: 'nextdotjs',    color: '000000', category: 'Frontend', description_cs: 'React framework pro produkční aplikace s SSR, SSG a App Routerem.',                description_en: 'React framework for production apps with SSR, SSG and App Router.' },
  { label: 'React',          slug: 'react',         color: '61DAFB', category: 'Frontend', description_cs: 'JavaScriptová knihovna pro tvorbu komponentových UI.',                             description_en: 'JavaScript library for building component-based UIs.' },
  { label: 'Vue.js',         slug: 'vuedotjs',      color: '4FC08D', category: 'Frontend', description_cs: 'Progresivní JavaScript framework pro tvorbu uživatelských rozhraní.',              description_en: 'Progressive JavaScript framework for building user interfaces.' },
  { label: 'Nuxt',           slug: 'nuxtdotjs',     color: '00DC82', category: 'Frontend', description_cs: 'Full-stack framework postavený na Vue.js s SSR a file-based routingem.',           description_en: 'Full-stack framework built on Vue.js with SSR and file-based routing.' },
  { label: 'Astro',          slug: 'astro',         color: 'FF5D01', category: 'Frontend', description_cs: 'Framework pro content-heavy weby s minimálním JavaScriptem na klientovi.',        description_en: 'Framework for content-heavy sites with minimal client-side JavaScript.' },
  { label: 'Remix',          slug: 'remix',         color: '000000', category: 'Frontend', description_cs: 'Full-stack React framework zaměřený na webové standardy a DX.',                   description_en: 'Full-stack React framework focused on web standards and DX.' },
  { label: 'Angular',        slug: 'angular',       color: 'DD0031', category: 'Frontend', description_cs: 'Komplexní TypeScript framework od Google pro enterprise aplikace.',                description_en: 'Comprehensive TypeScript framework by Google for enterprise apps.' },
  { label: 'Svelte',         slug: 'svelte',        color: 'FF3E00', category: 'Frontend', description_cs: 'Komponentový framework kompilující se do čistého JS bez runtime overhead.',       description_en: 'Component framework that compiles to vanilla JS with no runtime overhead.' },
  { label: 'SvelteKit',      slug: 'sveltekit',      color: 'FF3E00', category: 'Frontend', description_cs: 'Full-stack framework postavený na Svelte s SSR a file-based routingem.',          description_en: 'Full-stack framework built on Svelte with SSR and file-based routing.' },

  // ── Styling & UI
  { label: 'Tailwind CSS',   slug: 'tailwindcss',   color: '06B6D4', category: 'Frontend', description_cs: 'Utility-first CSS framework pro rychlé stylování přímo v HTML.',                  description_en: 'Utility-first CSS framework for rapid styling directly in HTML.' },
  { label: 'Sass',           slug: 'sass',          color: 'CC6699', category: 'Frontend', description_cs: 'CSS preprocesor přidávající proměnné, mixiny a vnořené selektory.',               description_en: 'CSS preprocessor adding variables, mixins and nested selectors.' },
  { label: 'shadcn/ui',      slug: 'shadcnui',      color: '000000', category: 'Frontend', description_cs: 'Kolekce přístupných komponent pro React postavená na Radix UI a Tailwindu.',      description_en: 'Accessible component collection for React built on Radix UI and Tailwind.' },
  { label: 'Framer Motion',  slug: 'framer',        color: '0055FF', category: 'Frontend', description_cs: 'Animační knihovna pro React s deklarativním API a gestickými interakcemi.',       description_en: 'Animation library for React with declarative API and gesture support.' },
  { label: 'Three.js',       slug: 'threedotjs',    color: '000000', category: 'Frontend', description_cs: 'JavaScriptová knihovna pro 3D grafiku v prohlížeči přes WebGL.',                  description_en: 'JavaScript library for 3D graphics in the browser via WebGL.' },

  // ── Mobile
  { label: 'React Native',   slug: 'react',         color: '61DAFB', category: 'Frontend', description_cs: 'Framework pro tvorbu nativních mobilních aplikací v Reactu.',                     description_en: 'Framework for building native mobile apps with React.' },
  { label: 'Expo',           slug: 'expo',          color: '000020', category: 'Frontend', description_cs: 'Platforma nad React Native zjednodušující vývoj a nasazení mobilních aplikací.',  description_en: 'Platform built on React Native simplifying mobile app development and deployment.' },

  // ── Languages
  { label: 'TypeScript',     slug: 'typescript',    color: '3178C6', category: 'Jazyk',    description_cs: 'Typovaná nadstavba JavaScriptu pro bezpečnější a škálovatelnější kód.',          description_en: 'Typed superset of JavaScript for safer and more scalable code.' },
  { label: 'JavaScript',     slug: 'javascript',    color: 'F7DF1E', category: 'Jazyk',    description_cs: 'Základní jazyk webu pro interaktivní frontend i serverový kód.',                 description_en: 'The core language of the web for interactive frontend and server-side code.' },
  { label: 'Python',         slug: 'python',        color: '3776AB', category: 'Jazyk',    description_cs: 'Univerzální jazyk pro scripting, datovou analýzu a backend.',                    description_en: 'Versatile language for scripting, data analysis and backend development.' },
  { label: 'PHP',            slug: 'php',           color: '777BB4', category: 'Jazyk',    description_cs: 'Serverový skriptovací jazyk pohánějící velkou část webu.',                       description_en: 'Server-side scripting language powering a large part of the web.' },
  { label: 'Go',             slug: 'go',            color: '00ADD8', category: 'Jazyk',    description_cs: 'Kompilovaný jazyk od Google zaměřený na jednoduchost a výkon.',                  description_en: 'Compiled language by Google focused on simplicity and performance.' },
  { label: 'Rust',           slug: 'rust',          color: '000000', category: 'Jazyk',    description_cs: 'Systémový jazyk zaručující bezpečnost paměti bez garbage collectoru.',            description_en: 'Systems language guaranteeing memory safety without a garbage collector.' },
  { label: 'C#',             slug: 'csharp',        color: '512BD4', category: 'Jazyk',    description_cs: 'Moderní objektově orientovaný jazyk ekosystému .NET od Microsoftu.',             description_en: 'Modern object-oriented language from the .NET ecosystem by Microsoft.' },
  { label: 'Java',           slug: 'openjdk',       color: 'E76F00', category: 'Jazyk',    description_cs: 'Staticky typovaný jazyk pro enterprise backend a Android aplikace.',             description_en: 'Statically typed language for enterprise backend and Android apps.' },
  { label: 'Kotlin',         slug: 'kotlin',        color: '7F52FF', category: 'Jazyk',    description_cs: 'Moderní jazyk pro JVM a Android, plně interoperabilní s Javou.',                description_en: 'Modern JVM and Android language, fully interoperable with Java.' },
  { label: 'Swift',          slug: 'swift',         color: 'F05138', category: 'Jazyk',    description_cs: 'Jazyk Apple pro vývoj iOS, macOS a dalších platforem.',                         description_en: 'Apple language for iOS, macOS and other platform development.' },

  // ── Backend frameworks
  { label: 'Node.js',        slug: 'nodedotjs',     color: '339933', category: 'Backend',  description_cs: 'JavaScriptové runtime prostředí pro serverový kód.',                             description_en: 'JavaScript runtime environment for server-side code.' },
  { label: 'Express',        slug: 'express',       color: '000000', category: 'Backend',  description_cs: 'Minimalistický webový framework pro Node.js.',                                   description_en: 'Minimalist web framework for Node.js.' },
  { label: 'Fastify',        slug: 'fastify',       color: '000000', category: 'Backend',  description_cs: 'Rychlý a nízkoúrovňový webový framework pro Node.js s důrazem na výkon.',       description_en: 'Fast and low-overhead web framework for Node.js focused on performance.' },
  { label: 'Hono',           slug: 'hono',          color: 'E36002', category: 'Backend',  description_cs: 'Ultralehký webový framework pro Edge runtime (Cloudflare Workers, Deno).',      description_en: 'Ultra-lightweight web framework for Edge runtimes (Cloudflare Workers, Deno).' },
  { label: 'Laravel',        slug: 'laravel',       color: 'FF2D20', category: 'Backend',  description_cs: 'Elegantní PHP framework s expresivní syntaxí a bohatým ekosystémem.',           description_en: 'Elegant PHP framework with expressive syntax and rich ecosystem.' },
  { label: 'Django',         slug: 'django',        color: '092E20', category: 'Backend',  description_cs: 'Full-stack Python framework s principem "batteries included".',                  description_en: 'Full-stack Python framework following the "batteries included" principle.' },
  { label: 'FastAPI',        slug: 'fastapi',       color: '009688', category: 'Backend',  description_cs: 'Moderní Python framework pro rychlé tvorbu API s automatickou dokumentací.',    description_en: 'Modern Python framework for quickly building APIs with automatic documentation.' },
  { label: 'NestJS',         slug: 'nestjs',        color: 'E0234E', category: 'Backend',  description_cs: 'Progresivní Node.js framework pro škálovatelné serverové aplikace.',            description_en: 'Progressive Node.js framework for scalable server-side applications.' },
  { label: 'tRPC',           slug: 'trpc',          color: '2596BE', category: 'Backend',  description_cs: 'End-to-end typesafe API vrstva bez generování schémat.',                        description_en: 'End-to-end typesafe API layer without schema generation.' },
  { label: 'Supabase',       slug: 'supabase',      color: '3FCF8E', category: 'Backend',  description_cs: 'Open-source alternativa k Firebase — databáze, auth a storage v jednom.',      description_en: 'Open-source Firebase alternative — database, auth and storage in one.' },
  { label: 'Firebase',       slug: 'firebase',      color: 'FFCA28', category: 'Backend',  description_cs: 'Backend-as-a-Service platforma od Google pro realtime databázi a auth.',       description_en: 'Backend-as-a-Service platform by Google for realtime database and auth.' },
  { label: 'Stripe',         slug: 'stripe',        color: '635BFF', category: 'Backend',  description_cs: 'API pro zpracování online plateb a správu předplatného.',                       description_en: 'API for processing online payments and managing subscriptions.' },
  { label: 'GraphQL',        slug: 'graphql',       color: 'E10098', category: 'Backend',  description_cs: 'Query jazyk pro API umožňující přesné dotazování na data.',                    description_en: 'Query language for APIs enabling precise data fetching.' },

  // ── Databases
  { label: 'PostgreSQL',     slug: 'postgresql',    color: '4169E1', category: 'Backend',  description_cs: 'Výkonná open-source relační databáze s pokročilými funkcemi.',                  description_en: 'Powerful open-source relational database with advanced features.' },
  { label: 'MySQL',          slug: 'mysql',         color: '4479A1', category: 'Backend',  description_cs: 'Nejrozšířenější open-source relační databáze, základ LAMP stacku.',             description_en: 'The most widely used open-source relational database, backbone of the LAMP stack.' },
  { label: 'SQLite',         slug: 'sqlite',        color: '003B57', category: 'Backend',  description_cs: 'Serverless embedded SQL databáze ideální pro lokální vývoj a menší projekty.',  description_en: 'Serverless embedded SQL database ideal for local development and smaller projects.' },
  { label: 'MongoDB',        slug: 'mongodb',       color: '47A248', category: 'Backend',  description_cs: 'NoSQL dokumentová databáze pro flexibilní datové struktury.',                   description_en: 'NoSQL document database for flexible data structures.' },
  { label: 'Redis',          slug: 'redis',         color: 'FF4438', category: 'Backend',  description_cs: 'In-memory datová struktura pro cache, session store a pub/sub.',                description_en: 'In-memory data structure store for cache, session store and pub/sub.' },
  { label: 'PlanetScale',    slug: 'planetscale',   color: '000000', category: 'Backend',  description_cs: 'Serverless MySQL platforma s branch workflow pro schémata.',                    description_en: 'Serverless MySQL platform with branch workflow for schema changes.' },
  { label: 'Turso',          slug: 'turso',         color: '4FF8D2', category: 'Backend',  description_cs: 'Edge SQLite databáze s nízkou latencí postavená na libSQL.',                   description_en: 'Edge SQLite database with low latency built on libSQL.' },

  // ── ORMs & query builders
  { label: 'Prisma',         slug: 'prisma',        color: '2D3748', category: 'Backend',  description_cs: 'Moderní ORM pro Node.js a TypeScript s typesafe databázovým klientem.',        description_en: 'Modern ORM for Node.js and TypeScript with a typesafe database client.' },
  { label: 'Drizzle ORM',    slug: 'drizzle',       color: 'C5F74F', category: 'Backend',  description_cs: 'Odlehčené TypeScript ORM s SQL-first přístupem a nulovou závislostí.',         description_en: 'Lightweight TypeScript ORM with SQL-first approach and zero dependencies.' },

  // ── DevOps & infrastructure
  { label: 'Docker',         slug: 'docker',        color: '2496ED', category: 'DevOps',   description_cs: 'Platforma pro kontejnerizaci a nasazení aplikací.',                             description_en: 'Platform for containerizing and deploying applications.' },
  { label: 'Kubernetes',     slug: 'kubernetes',    color: '326CE5', category: 'DevOps',   description_cs: 'Systém pro orchestraci kontejnerů ve velkém měřítku.',                         description_en: 'Container orchestration system for running workloads at scale.' },
  { label: 'GitHub Actions', slug: 'githubactions',  color: '2088FF', category: 'DevOps',   description_cs: 'CI/CD platforma integrovaná přímo do GitHubu pro automatizaci workflow.',      description_en: 'CI/CD platform integrated directly into GitHub for workflow automation.' },
  { label: 'Vercel',         slug: 'vercel',        color: 'FFFFFF', category: 'DevOps',   description_cs: 'Platforma pro nasazení frontend aplikací s automatickým CI/CD.',               description_en: 'Platform for deploying frontend apps with automatic CI/CD.' },
  { label: 'Netlify',        slug: 'netlify',       color: '00C7B7', category: 'DevOps',   description_cs: 'Platforma pro nasazení statických webů a serverless funkcí.',                  description_en: 'Platform for deploying static sites and serverless functions.' },
  { label: 'AWS',            slug: 'amazonaws',     color: 'FF9900', category: 'DevOps',   description_cs: 'Komplexní cloudová platforma Amazonu s desítkami managed services.',            description_en: 'Amazon\'s comprehensive cloud platform with dozens of managed services.' },
  { label: 'Cloudflare',     slug: 'cloudflare',    color: 'F38020', category: 'DevOps',   description_cs: 'CDN, DNS, ochrana DDoS a edge computing platforma.',                           description_en: 'CDN, DNS, DDoS protection and edge computing platform.' },
  { label: 'Nginx',          slug: 'nginx',         color: '009639', category: 'DevOps',   description_cs: 'Vysokovýkonný webový server a reverzní proxy.',                                description_en: 'High-performance web server and reverse proxy.' },
  { label: 'Linux',          slug: 'linux',         color: 'FCC624', category: 'DevOps',   description_cs: 'Open-source operační systém základ majority serverů a cloud infrastruktury.',  description_en: 'Open-source operating system powering the majority of servers and cloud infrastructure.' },

  // ── Tools & workflow
  { label: 'Git',            slug: 'git',           color: 'F05032', category: 'Nástroje', description_cs: 'Distribuovaný verzovací systém pro správu zdrojového kódu.',                   description_en: 'Distributed version control system for managing source code.' },
  { label: 'GitHub',         slug: 'github',        color: 'FFFFFF', category: 'Nástroje', description_cs: 'Platforma pro hosting repozitářů a spolupráci na kódu.',                      description_en: 'Platform for hosting repositories and collaborating on code.' },
  { label: 'VS Code',        slug: 'visualstudiocode', color: '007ACC', category: 'Nástroje', description_cs: 'Lehký ale výkonný editor s bohatým ekosystémem rozšíření.',               description_en: 'Lightweight but powerful editor with a rich extension ecosystem.' },
  { label: 'Vite',           slug: 'vite',          color: '646CFF', category: 'Nástroje', description_cs: 'Rychlý build nástroj a dev server pro moderní webové projekty.',               description_en: 'Fast build tool and dev server for modern web projects.' },
  { label: 'pnpm',           slug: 'pnpm',          color: 'F69220', category: 'Nástroje', description_cs: 'Rychlý a diskově efektivní správce balíčků pro Node.js.',                     description_en: 'Fast and disk-efficient package manager for Node.js.' },
  { label: 'Turborepo',      slug: 'turborepo',     color: 'EF4444', category: 'Nástroje', description_cs: 'Vysokovýkonný build systém pro JavaScript/TypeScript monorepa.',              description_en: 'High-performance build system for JavaScript/TypeScript monorepos.' },
  { label: 'Postman',        slug: 'postman',       color: 'FF6C37', category: 'Nástroje', description_cs: 'Platforma pro návrh, testování a dokumentaci REST API.',                      description_en: 'Platform for designing, testing and documenting REST APIs.' },
  { label: 'Sentry',         slug: 'sentry',        color: '362D59', category: 'Nástroje', description_cs: 'Platforma pro monitoring chyb a výkonu v produkčních aplikacích.',            description_en: 'Error and performance monitoring platform for production applications.' },

  // ── Design
  { label: 'Figma',          slug: 'figma',         color: 'F24E1E', category: 'Design',   description_cs: 'Cloudový nástroj pro UI/UX design a prototypování.',                           description_en: 'Cloud-based tool for UI/UX design and prototyping.' },
  { label: 'Adobe XD',       slug: 'adobexd',       color: 'FF61F6', category: 'Design',   description_cs: 'Vektorový nástroj Adobe pro UI design a interaktivní prototypy.',              description_en: 'Adobe\'s vector tool for UI design and interactive prototypes.' },
  { label: 'Photoshop',      slug: 'adobephotoshop', color: '31A8FF', category: 'Design',  description_cs: 'Průmyslový standard pro editaci rastrové grafiky a fotografií.',               description_en: 'Industry standard for raster graphics editing and photo manipulation.' },
  { label: 'Illustrator',    slug: 'adobeillustrator', color: 'FF9A00', category: 'Design', description_cs: 'Průmyslový standard pro tvorbu vektorové grafiky a ilustrací.',              description_en: 'Industry standard for creating vector graphics and illustrations.' },

  // ── Web fundamentals
  { label: 'HTML5',          slug: 'html5',         color: 'E34F26', category: 'Frontend', description_cs: 'Základní značkovací jazyk pro strukturu webových stránek.',                   description_en: 'The foundational markup language for structuring web pages.' },
  { label: 'CSS3',           slug: 'css3',          color: '1572B6', category: 'Frontend', description_cs: 'Kaskádové styly pro vizuální prezentaci webových stránek.',                  description_en: 'Cascading style sheets for the visual presentation of web pages.' },
  { label: 'Markdown',       slug: 'markdown',      color: '000000', category: 'Jazyk',    description_cs: 'Jednoduchý značkovací jazyk pro formátování prostého textu.',                 description_en: 'Lightweight markup language for formatting plain text.' },

  // ── Testing
  { label: 'Vitest',         slug: 'vitest',        color: '6E9F18', category: 'Nástroje', description_cs: 'Rychlý unit test framework pro Vite projekty s API kompatibilním s Jest.',   description_en: 'Fast unit test framework for Vite projects with Jest-compatible API.' },
  { label: 'Jest',           slug: 'jest',          color: 'C21325', category: 'Nástroje', description_cs: 'JavaScriptový testovací framework s nulovou konfigurací.',                   description_en: 'JavaScript testing framework with zero configuration.' },
  { label: 'Playwright',     slug: 'playwright',    color: '2EAD33', category: 'Nástroje', description_cs: 'Framework pro end-to-end testování moderních webových aplikací.',            description_en: 'Framework for end-to-end testing of modern web applications.' },
  { label: 'Cypress',        slug: 'cypress',       color: '69D3A7', category: 'Nástroje', description_cs: 'End-to-end testovací nástroj přímo v prohlížeči.',                          description_en: 'End-to-end testing tool running directly in the browser.' },
  { label: 'Storybook',      slug: 'storybook',     color: 'FF4785', category: 'Nástroje', description_cs: 'Nástroj pro vývoj a dokumentaci UI komponent v izolaci.',                   description_en: 'Tool for developing and documenting UI components in isolation.' },

  // ── Package managers & runtimes
  { label: 'Bun',            slug: 'bun',           color: 'FBF0DF', category: 'Nástroje', description_cs: 'Rychlý all-in-one JavaScript runtime, bundler a package manager.',           description_en: 'Fast all-in-one JavaScript runtime, bundler and package manager.' },
  { label: 'Deno',           slug: 'deno',          color: '000000', category: 'Nástroje', description_cs: 'Bezpečné runtime prostředí pro JavaScript a TypeScript od tvůrce Node.js.',  description_en: 'Secure runtime for JavaScript and TypeScript from the creator of Node.js.' },
  { label: 'npm',            slug: 'npm',           color: 'CB3837', category: 'Nástroje', description_cs: 'Výchozí správce balíčků pro Node.js ekosystém.',                            description_en: 'The default package manager for the Node.js ecosystem.' },

  // ── More databases & infra
  { label: 'Elasticsearch',  slug: 'elasticsearch', color: '005571', category: 'Backend',  description_cs: 'Distribuovaný vyhledávací a analytický engine pro velká data.',              description_en: 'Distributed search and analytics engine for large-scale data.' },
  { label: 'RabbitMQ',       slug: 'rabbitmq',      color: 'FF6600', category: 'Backend',  description_cs: 'Message broker pro asynchronní komunikaci mezi službami.',                   description_en: 'Message broker for asynchronous communication between services.' },
  { label: 'Apache Kafka',   slug: 'apachekafka',   color: '231F20', category: 'Backend',  description_cs: 'Distribuovaná streamovací platforma pro real-time datové pipeline.',         description_en: 'Distributed streaming platform for real-time data pipelines.' },
  { label: 'Neon',           slug: 'neon',          color: '00E699', category: 'Backend',  description_cs: 'Serverless PostgreSQL s branch workflow a auto-scaling.',                    description_en: 'Serverless PostgreSQL with branch workflow and auto-scaling.' },
  { label: 'Upstash',        slug: 'upstash',       color: '00E9A3', category: 'Backend',  description_cs: 'Serverless Redis a Kafka s per-request cenami a edge kompatibilitou.',      description_en: 'Serverless Redis and Kafka with per-request pricing and edge compatibility.' },

  // ── More DevOps
  { label: 'Terraform',      slug: 'terraform',     color: '7B42BC', category: 'DevOps',   description_cs: 'Infrastructure as code nástroj pro definici a nasazení cloud infrastruktury.',description_en: 'Infrastructure as code tool for defining and deploying cloud infrastructure.' },
  { label: 'Ansible',        slug: 'ansible',       color: 'EE0000', category: 'DevOps',   description_cs: 'Automatizační nástroj pro konfiguraci serverů a nasazení aplikací.',        description_en: 'Automation tool for server configuration and application deployment.' },
  { label: 'GitLab',         slug: 'gitlab',        color: 'FC6D26', category: 'DevOps',   description_cs: 'DevOps platforma s Git repozitáři, CI/CD a issue trackingem.',             description_en: 'DevOps platform with Git repositories, CI/CD and issue tracking.' },
  { label: 'Grafana',        slug: 'grafana',       color: 'F46800', category: 'DevOps',   description_cs: 'Open-source platforma pro monitoring a vizualizaci metrik.',               description_en: 'Open-source platform for monitoring and metrics visualization.' },
  { label: 'Prometheus',     slug: 'prometheus',    color: 'E6522C', category: 'DevOps',   description_cs: 'Open-source monitoring systém a time series databáze.',                    description_en: 'Open-source monitoring system and time series database.' },

  // ── More languages
  { label: 'C++',            slug: 'cplusplus',     color: '00599C', category: 'Jazyk',    description_cs: 'Výkonný systémový jazyk pro výkon-kritické aplikace a herní engine.',       description_en: 'High-performance systems language for performance-critical apps and game engines.' },
  { label: 'Ruby',           slug: 'ruby',          color: 'CC342D', category: 'Jazyk',    description_cs: 'Dynamický jazyk optimalizovaný pro produktivitu vývojáře.',                 description_en: 'Dynamic language optimized for developer productivity.' },
  { label: 'Dart',           slug: 'dart',          color: '0175C2', category: 'Jazyk',    description_cs: 'Jazyk od Google pro tvorbu multiplatformních aplikací ve Flutteru.',        description_en: 'Google language for building cross-platform apps with Flutter.' },
  { label: 'Lua',            slug: 'lua',           color: '2C2D72', category: 'Jazyk',    description_cs: 'Odlehčený skriptovací jazyk populární v herním vývoji.',                   description_en: 'Lightweight scripting language popular in game development.' },
  { label: 'R',              slug: 'r',             color: '276DC3', category: 'Jazyk',    description_cs: 'Statistický jazyk pro datovou analýzu a strojové učení.',                  description_en: 'Statistical language for data analysis and machine learning.' },

  // ── More frameworks & libs
  { label: 'Ruby on Rails',  slug: 'rubyonrails',   color: 'D30001', category: 'Backend',  description_cs: 'Full-stack Ruby framework s konvencí nad konfigurací.',                    description_en: 'Full-stack Ruby framework with convention over configuration.' },
  { label: 'Spring Boot',    slug: 'springboot',    color: '6DB33F', category: 'Backend',  description_cs: 'Java framework pro tvorbu production-ready mikroslužeb a API.',            description_en: 'Java framework for building production-ready microservices and APIs.' },
  { label: 'Flutter',        slug: 'flutter',       color: '02569B', category: 'Frontend', description_cs: 'UI toolkit od Google pro multiplatformní vývoj z jediné kódové základny.', description_en: 'Google UI toolkit for cross-platform development from a single codebase.' },
  { label: 'Socket.io',      slug: 'socketdotio',   color: '010101', category: 'Backend',  description_cs: 'Knihovna pro real-time bidirektionální komunikaci přes WebSocket.',         description_en: 'Library for real-time bidirectional communication via WebSocket.' },
  { label: 'Zod',            slug: 'zod',           color: '3E67B1', category: 'Backend',  description_cs: 'TypeScript-first schéma validace a parsing knihovna.',                     description_en: 'TypeScript-first schema validation and parsing library.' },
  { label: 'Zustand',        slug: 'zustand',       color: '443E38', category: 'Frontend', description_cs: 'Minimalistická state management knihovna pro React.',                      description_en: 'Minimalistic state management library for React.' },
  { label: 'Redux',          slug: 'redux',         color: '764ABC', category: 'Frontend', description_cs: 'Prediktabilní state container pro JavaScript aplikace.',                   description_en: 'Predictable state container for JavaScript applications.' },
  { label: 'Styledcomponents', slug: 'styledcomponents', color: 'DB7093', category: 'Frontend', description_cs: 'CSS-in-JS knihovna pro stylování React komponent.',             description_en: 'CSS-in-JS library for styling React components.' },
  { label: 'Webpack',        slug: 'webpack',       color: '8DD6F9', category: 'Nástroje', description_cs: 'Modulový bundler pro JavaScript aplikace.',                               description_en: 'Module bundler for JavaScript applications.' },
  { label: 'ESLint',         slug: 'eslint',        color: '4B32C3', category: 'Nástroje', description_cs: 'Statická analýza kódu pro nalezení a opravu problémů v JavaScriptu.',     description_en: 'Static code analysis for finding and fixing problems in JavaScript.' },
  { label: 'Prettier',       slug: 'prettier',      color: 'F7B93E', category: 'Nástroje', description_cs: 'Formátovač kódu pro konzistentní styl napříč projektem.',                 description_en: 'Code formatter for consistent style across a project.' },
  { label: 'Biome',          slug: 'biome',         color: '60A5FA', category: 'Nástroje', description_cs: 'Rychlý formatter a linter pro JavaScript/TypeScript v jednom nástroji.',   description_en: 'Fast all-in-one formatter and linter for JavaScript/TypeScript.' },
]

const CATEGORY_PRESETS = ['Frontend', 'Backend', 'Jazyk', 'DevOps', 'Design', 'Nástroje', 'Ostatní']

type Props = {
  skill?: Skill | null
  onClose: () => void
}

type FormState = {
  name: string
  category: string
  icon: string
  icon_color: string
  level: number
  order_index: number
  is_visible: boolean
  description_cs: string
  description_en: string
  years_experience: string
}

const EMPTY: FormState = {
  name: '',
  category: '',
  icon: '',
  icon_color: '',
  level: 3,
  order_index: 0,
  is_visible: true,
  description_cs: '',
  description_en: '',
  years_experience: '',
}

// Slugy, pro které Simple Icons nemá ikonu → použijeme lokální PNG z /public/icons/
const LOCAL_ICON_SLUGS = new Set([
  'adobephotoshop',
  'adobeillustrator',
  'adobexd',
  'openjdk',    // Java
  'csharp',     // C#
  'amazonaws',  // AWS
  'sveltekit',  // SvelteKit
  'visualstudiocode', // VS Code
  'playwright', // Playwright
  'zustand',    // Zustand
  'css3',
])

function IconPreview({ icon, color }: { icon: string; color: string }) {
  const [failed, setFailed] = useState(false)
  const [localFailed, setLocalFailed] = useState(false)

  useEffect(() => { setFailed(false); setLocalFailed(false) }, [icon, color])

  if (!icon) return <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-white/20 text-lg">⚡</span>

  const useLocal = LOCAL_ICON_SLUGS.has(icon) || failed

  if (useLocal && localFailed) {
    return <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-[10px] text-white/25">?</span>
  }

  if (useLocal) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/icons/${icon}.png`}
        alt=""
        className="w-8 h-8 object-contain"
        onError={() => setLocalFailed(true)}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.simpleicons.org/${icon}/${(color || 'ffffff').replace('#', '')}`}
      alt=""
      className="w-8 h-8 object-contain"
      onError={() => setFailed(true)}
    />
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 cursor-pointer select-none"
    >
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-orange-500' : 'bg-white/10'}`}>
        <span className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
      </span>
      <span className={`text-[13px] font-medium transition-colors ${checked ? 'text-white/85' : 'text-white/45'}`}>{label}</span>
    </button>
  )
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full h-9 px-3 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-white/75 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 transition-colors'
const textareaCls = 'w-full px-3 py-2.5 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] leading-relaxed text-white/75 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-white/[0.04] transition-colors resize-none'

export function SkillForm({ skill, onClose }: Props) {
  const router = useRouter()
  const isEdit = !!skill
  const [form, setForm] = useState<FormState>(
    skill
      ? {
          name: skill.name,
          category: skill.category ?? '',
          icon: skill.icon ?? '',
          icon_color: skill.icon_color ?? '',
          level: skill.level,
          order_index: skill.order_index,
          is_visible: skill.is_visible,
          description_cs: skill.description_cs ?? '',
          description_en: skill.description_en ?? '',
          years_experience: skill.years_experience != null ? String(skill.years_experience) : '',
        }
      : EMPTY
  )

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [presetSearch, setPresetSearch] = useState('')
  const [presetCategory, setPresetCategory] = useState<string | null>(null)

  const presetCategories = Array.from(new Set(SKILL_PRESETS.map(p => p.category)))

  const filteredPresets = SKILL_PRESETS.filter(p => {
    const matchesCat = presetCategory ? p.category === presetCategory : true
    const q = presetSearch.toLowerCase()
    const matchesSearch = q ? p.label.toLowerCase().includes(q) : true
    return matchesCat && matchesSearch
  })

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }))

  // Escape zavře modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const applyPreset = (preset: typeof SKILL_PRESETS[0]) => {
    setForm(f => ({
      ...f,
      name: preset.label,
      icon: preset.slug,
      icon_color: preset.color,
      category: preset.category,
      description_cs: preset.description_cs,
      description_en: preset.description_en,
    }))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) { setError('Název je povinný'); return }
    setError(null)

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      icon: form.icon.trim() || null,
      icon_color: form.icon_color.trim() || null,
      level: form.level,
      order_index: form.order_index,
      is_visible: form.is_visible,
      description_cs: form.description_cs.trim() || null,
      description_en: form.description_en.trim() || null,
      years_experience: form.years_experience !== '' ? Number(form.years_experience) : null,
    }

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateSkill(skill.id, payload)
        } else {
          await createSkill(payload)
        }
        router.refresh()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Něco se pokazilo')
      }
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-[#0f0f14] border-l border-white/[0.07] shadow-2xl shadow-black/50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-white/90">
              {isEdit ? 'Upravit skill' : 'Nový skill'}
            </h2>
            <p className="text-[12px] text-white/35 mt-0.5">
              {isEdit ? `Editace: ${skill.name}` : 'Přidej novou technologii nebo dovednost'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white/35 hover:text-white/75 hover:bg-white/[0.06] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">

          {/* Presety */}
          <div>
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2">Rychlý výběr</p>

            {/* Search + kategorie filter */}
            <div className="flex flex-col gap-2 mb-3">
              <input
                type="text"
                value={presetSearch}
                onChange={e => setPresetSearch(e.target.value)}
                placeholder="Hledat technologii…"
                className="w-full h-8 px-3 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[12px] text-white/70 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 transition-colors"
              />
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setPresetCategory(null)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                    presetCategory === null
                      ? 'border-orange-500/40 text-orange-400 bg-orange-500/[0.08]'
                      : 'border-white/[0.07] text-white/30 hover:text-white/55 hover:border-white/[0.12]'
                  }`}
                >
                  Vše
                </button>
                {presetCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPresetCategory(presetCategory === cat ? null : cat)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                      presetCategory === cat
                        ? 'border-orange-500/40 text-orange-400 bg-orange-500/[0.08]'
                        : 'border-white/[0.07] text-white/30 hover:text-white/55 hover:border-white/[0.12]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Preset tlačítka */}
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
              {filteredPresets.length === 0 && (
                <p className="text-[11px] text-white/25 py-2">Žádná technologie nenalezena.</p>
              )}
              {filteredPresets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                    form.name === preset.label
                      ? 'border-orange-500/40 text-orange-400 bg-orange-500/[0.08]'
                      : 'border-white/[0.07] text-white/45 hover:border-white/[0.15] hover:text-white/70 bg-white/[0.02]'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      LOCAL_ICON_SLUGS.has(preset.slug)
                        ? `/icons/${preset.slug}.png`
                        : `https://cdn.simpleicons.org/${preset.slug}/${preset.color}`
                    }
                    alt=""
                    className="w-3 h-3 object-contain"
                    onError={e => {
                      const el = e.currentTarget
                      if (!el.dataset.triedLocal && !LOCAL_ICON_SLUGS.has(preset.slug)) {
                        el.dataset.triedLocal = '1'
                        el.src = `/icons/${preset.slug}.png`
                      } else {
                        el.style.display = 'none'
                      }
                    }}
                  />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/[0.05]" />

          {/* Název + ikona preview */}
          <div className="flex gap-3 items-end">
            <Field label="Název">
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="např. React"
                className={inputCls}
              />
            </Field>
            <div className="shrink-0 mb-0.5">
              <IconPreview icon={form.icon} color={form.icon_color} />
            </div>
          </div>

          {/* Ikona + barva */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Simple Icons slug">
              <input
                type="text"
                value={form.icon}
                onChange={e => set('icon', e.target.value)}
                placeholder="např. react"
                className={inputCls}
              />
            </Field>
            <Field label="Barva ikony (hex)">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.icon_color}
                  onChange={e => set('icon_color', e.target.value)}
                  placeholder="61DAFB"
                  className={inputCls}
                />
                <input
                  type="color"
                  value={`#${(form.icon_color || 'ffffff').replace('#', '')}`}
                  onChange={e => set('icon_color', e.target.value.replace('#', ''))}
                  className="h-9 w-10 rounded-lg border border-white/[0.07] bg-white/[0.03] cursor-pointer px-1 shrink-0"
                />
              </div>
            </Field>
          </div>

          {/* Kategorie */}
          <Field label="Kategorie">
            <div className="space-y-2">
              <input
                type="text"
                value={form.category}
                onChange={e => set('category', e.target.value)}
                placeholder="např. Frontend"
                className={inputCls}
              />
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => set('category', cat)}
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md border transition-all ${
                      form.category === cat
                        ? 'border-orange-500/40 text-orange-400 bg-orange-500/[0.06]'
                        : 'border-white/[0.07] text-white/35 hover:text-white/60 hover:border-white/[0.12]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Field>

          {/* Level */}
          <Field label={`Úroveň — ${form.level}/5`}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set('level', i + 1)}
                    className={`w-10 h-2.5 rounded-full transition-all ${
                      i < form.level
                        ? 'bg-orange-500 hover:bg-orange-400'
                        : 'bg-white/[0.08] hover:bg-white/[0.15]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[12px] text-white/30">
                {['', 'Začátečník', 'Základy', 'Pokročilý', 'Zkušený', 'Expert'][form.level]}
              </span>
            </div>
          </Field>

          {/* Roky zkušeností */}
          <Field label="Roky zkušeností">
            <input
              type="number"
              min="0"
              max="50"
              value={form.years_experience}
              onChange={e => set('years_experience', e.target.value)}
              placeholder="např. 3"
              className={inputCls}
            />
          </Field>

          {/* Popis */}
          <Field label="Popis / tooltip (CS)">
            <textarea
              value={form.description_cs}
              onChange={e => set('description_cs', e.target.value)}
              placeholder="Krátký popis česky…"
              rows={2}
              className={textareaCls}
            />
          </Field>

          <Field label="Popis / tooltip (EN)">
            <textarea
              value={form.description_en}
              onChange={e => set('description_en', e.target.value)}
              placeholder="Short description in English…"
              rows={2}
              className={textareaCls}
            />
          </Field>

          {/* Order index */}
          <Field label="Pořadí (order index)">
            <input
              type="number"
              min="0"
              value={form.order_index}
              onChange={e => set('order_index', Number(e.target.value))}
              className={inputCls}
            />
          </Field>

          {/* Viditelnost */}
          <Toggle
            checked={form.is_visible}
            onChange={v => set('is_visible', v)}
            label="Zobrazit na webu"
          />

          {/* Error */}
          {error && (
            <p className="text-[13px] text-rose-400 bg-rose-500/[0.08] border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06] shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="h-9 px-4 rounded-xl text-[13px] font-semibold text-white/55 hover:text-white/85 hover:bg-white/[0.05] transition-all disabled:opacity-50"
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="h-9 px-5 rounded-xl text-[13px] font-semibold bg-gradient-to-b from-orange-400 to-orange-500 hover:from-orange-400 hover:to-orange-600 active:scale-[0.98] text-white shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset,0_4px_12px_-2px_rgba(249,115,22,0.4)] transition-all disabled:opacity-60 disabled:active:scale-100 flex items-center gap-2"
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? 'Uložit změny' : 'Vytvořit skill'}
          </button>
        </div>
      </div>
    </>
  )
}