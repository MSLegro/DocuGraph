import React from 'react';
import {
  Folder,
  Cloud,
  Server,
  Layout,
  Database,
  ShieldCheck,
  FlaskConical,
  BookOpen,
  Package,
  Settings,
  Workflow,
  Smartphone,
  Boxes,
  Cpu,
  Layers
} from 'lucide-react';

export interface FolderThemeConfig {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeBg: string;
}

export function getFolderTheme(folderName: string): FolderThemeConfig {
  const name = folderName.toLowerCase().trim();

  // Cloud & Infrastructure
  if (/^(infra|infrastructure|cloud|k8s|kubernetes|docker|deploy|aws|azure|gcp|terraform)/i.test(name)) {
    return {
      icon: Cloud,
      colorClass: 'text-sky-400 group-hover:text-sky-300',
      badgeBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400'
    };
  }

  // API, Backend & Services
  if (/^(api|server|backend|microservice|service|gateway|endpoint)/i.test(name)) {
    return {
      icon: Server,
      colorClass: 'text-emerald-400 group-hover:text-emerald-300',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    };
  }

  // Web, Frontend & UI
  if (/^(web|frontend|ui|client|views|pages|app)/i.test(name)) {
    return {
      icon: Layout,
      colorClass: 'text-blue-400 group-hover:text-blue-300',
      badgeBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
    };
  }

  // Database & Storage
  if (/^(db|database|sql|postgres|mysql|mongo|redis|storage|data|cache)/i.test(name)) {
    return {
      icon: Database,
      colorClass: 'text-purple-400 group-hover:text-purple-300',
      badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
    };
  }

  // Security & Authentication
  if (/^(auth|security|login|oauth|iam|permission|token)/i.test(name)) {
    return {
      icon: ShieldCheck,
      colorClass: 'text-amber-400 group-hover:text-amber-300',
      badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    };
  }

  // Tests & QA
  if (/^(test|tests|spec|e2e|qa|unit|cypress)/i.test(name)) {
    return {
      icon: FlaskConical,
      colorClass: 'text-lime-400 group-hover:text-lime-300',
      badgeBg: 'bg-lime-500/10 border-lime-500/20 text-lime-400'
    };
  }

  // Documentation
  if (/^(doc|docs|documentation|wiki|spec|arch|architecture|guide)/i.test(name)) {
    return {
      icon: BookOpen,
      colorClass: 'text-orange-400 group-hover:text-orange-300',
      badgeBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400'
    };
  }

  // Core, Shared & Lib
  if (/^(core|shared|lib|common|packages|kernel)/i.test(name)) {
    return {
      icon: Package,
      colorClass: 'text-fuchsia-400 group-hover:text-fuchsia-300',
      badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400'
    };
  }

  // Config & Settings
  if (/^(config|settings|env|setup|tools)/i.test(name)) {
    return {
      icon: Settings,
      colorClass: 'text-zinc-400 group-hover:text-zinc-300',
      badgeBg: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
    };
  }

  // CI/CD & Workflows
  if (/^(workflow|pipeline|ci|cd|actions|automation)/i.test(name)) {
    return {
      icon: Workflow,
      colorClass: 'text-rose-400 group-hover:text-rose-300',
      badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400'
    };
  }

  // Mobile
  if (/^(mobile|ios|android|native)/i.test(name)) {
    return {
      icon: Smartphone,
      colorClass: 'text-cyan-400 group-hover:text-cyan-300',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
    };
  }

  // Components & Modules
  if (/^(components|modules|widgets|blocks)/i.test(name)) {
    return {
      icon: Boxes,
      colorClass: 'text-teal-400 group-hover:text-teal-300',
      badgeBg: 'bg-teal-500/10 border-teal-500/20 text-teal-400'
    };
  }

  // Default Folder
  return {
    icon: Folder,
    colorClass: 'text-brand-glow group-hover:text-white',
    badgeBg: 'bg-brand-primary/10 border-brand-primary/20 text-brand-glow'
  };
}
