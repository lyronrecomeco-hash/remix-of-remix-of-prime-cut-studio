import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  MessageSquare, 
  Users, 
  Clock,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

// Mock data
const messageData = [
  { date: 'Seg', enviadas: 420, recebidas: 380 },
  { date: 'Ter', enviadas: 532, recebidas: 456 },
  { date: 'Qua', enviadas: 601, recebidas: 520 },
  { date: 'Qui', enviadas: 478, recebidas: 410 },
  { date: 'Sex', enviadas: 689, recebidas: 590 },
  { date: 'Sáb', enviadas: 345, recebidas: 280 },
  { date: 'Dom', enviadas: 234, recebidas: 190 },
];

const flowPerformance = [
  { name: 'Atendimento', execuções: 1234, taxa: 95 },
  { name: 'Vendas', execuções: 856, taxa: 88 },
  { name: 'Suporte', execuções: 654, taxa: 92 },
  { name: 'Marketing', execuções: 432, taxa: 78 },
];

const pieData = [
  { name: 'Atendimento', value: 40, color: '#3b82f6' },
  { name: 'Vendas', value: 30, color: '#8b5cf6' },
  { name: 'Suporte', value: 20, color: '#22c55e' },
  { name: 'Outros', value: 10, color: '#f59e0b' },
];

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  delay?: number;
}

function AnimatedStatCard({ title, value, change, icon: Icon, delay = 0 }: StatCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const numericValue = typeof value === 'string' ? parseInt(value.replace(/[^0-9]/g, '')) : value;

  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const duration = 1500;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setAnimatedValue(Math.floor(eased * numericValue));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [numericValue, delay]);

  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay / 1000, type: 'spring' }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Card className="relative overflow-hidden group">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <motion.p 
                className="text-3xl font-bold mt-1"
                key={animatedValue}
              >
                {typeof value === 'string' && value.includes('%') 
                  ? `${animatedValue}%`
                  : animatedValue.toLocaleString()
                }
              </motion.p>
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                isPositive ? "text-green-500" : "text-red-500"
              )}>
                {isPositive ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                <span>{Math.abs(change)}% vs semana anterior</span>
              </div>
            </div>
            <motion.div
              className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-7 h-7 text-primary" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AnalyticsDashboard() {
  const stats = [
    { title: 'Mensagens Enviadas', value: 12847, change: 12, icon: MessageSquare },
    { title: 'Taxa de Resposta', value: '94%', change: 3, icon: Target },
    { title: 'Tempo Médio', value: '2.3min', change: -8, icon: Clock },
    { title: 'Novos Contatos', value: 456, change: 24, icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BarChart3 className="w-7 h-7 text-primary" />
            </motion.div>
            Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Métricas e insights do seu negócio
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Activity className="w-3 h-3" />
          Atualizado agora
        </Badge>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <AnimatedStatCard
            key={stat.title}
            {...stat}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Mensagens (Últimos 7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={messageData}>
                  <defs>
                    <linearGradient id="colorEnviadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRecebidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="enviadas" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorEnviadas)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="recebidas" 
                    stroke="#22c55e" 
                    fillOpacity={1} 
                    fill="url(#colorRecebidas)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Distribuição por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Flow Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Performance dos Fluxos
            </CardTitle>
            <CardDescription>Taxa de sucesso por automação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flowPerformance.map((flow, index) => (
                <motion.div
                  key={flow.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + (index * 0.1) }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{flow.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({flow.execuções.toLocaleString()} execuções)
                      </span>
                    </div>
                    <Badge variant={flow.taxa >= 90 ? "default" : "secondary"}>
                      {flow.taxa}%
                    </Badge>
                  </div>
                  <Progress value={flow.taxa} className="h-2" />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
