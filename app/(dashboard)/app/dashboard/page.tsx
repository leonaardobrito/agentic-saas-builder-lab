'use client';

import Link from 'next/link';
import { Users, Scissors, UserCircle, ArrowUpRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { signOutAction } from '@/features/auth/presentation/actions';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { staggerContainerVariants, staggerItemVariants } from '@/shared/lib/animations';

const quickLinks = [
  {
    href: '/app/professionals',
    title: 'Profissionais',
    description: 'Gerencie a equipe do seu salao.',
    icon: Users,
    gradient: 'from-rose-600 to-pink-600',
  },
  {
    href: '/app/services',
    title: 'Servicos',
    description: 'Catalogo de servicos e precos.',
    icon: Scissors,
    gradient: 'from-rose-500 to-amber-500',
  },
  {
    href: '/app/customers',
    title: 'Clientes',
    description: 'Base de clientes e historico.',
    icon: UserCircle,
    gradient: 'from-emerald-500 to-emerald-600',
  },
];

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bem-vindo de volta! Aqui esta o resumo do seu salao.
          </p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="compact">
            Sair
          </Button>
        </form>
      </div>

      {/* Quick Access Cards */}
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {quickLinks.map((link) => (
          <motion.div key={link.href} variants={staggerItemVariants}>
            <Link href={link.href} className="block group">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md shadow-slate-200/50 dark:shadow-xl dark:shadow-slate-950/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${link.gradient} flex items-center justify-center text-white shadow-lg shadow-rose-600/20`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                  {link.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {link.description}
                </p>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Bem-vindo ao StyleFlow!
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Seu sistema de gestao para saloes de beleza esta pronto para uso.
            Comece cadastrando seus profissionais, servicos e clientes.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
