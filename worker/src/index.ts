import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { processEmailsForConfigLogic } from './lib/email-logic/processor';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runWorker() {
  console.log('--- Email Monitor Worker Iniciado ---');
  
  // Update heartbeat status to online
  const updateWorkerHeartbeat = async (status: string, metrics: any = {}) => {
    try {
      await supabase.from('worker_heartbeat').upsert({
        id: '00000000-0000-0000-0000-000000000000', // Global worker ID
        last_heartbeat: new Date().toISOString(),
        status,
        ...metrics
      });
    } catch (err: any) {
      console.error('Erro ao atualizar heartbeat:', err.message);
    }
  };

  const processCommands = async () => {
    try {
      const { data: commands } = await supabase
        .from('worker_control')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (commands && commands.length > 0) {
        for (const cmd of commands) {
          console.log(`[Worker] Processando comando: ${cmd.command}`);
          await supabase.from('worker_control').update({ status: 'processing' }).eq('id', cmd.id);
          
          if (cmd.command === 'restart') {
            await supabase.from('worker_control').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', cmd.id);
            await updateWorkerHeartbeat('running');
            console.log('[Worker] Reinício solicitado via Docker (simulado: saindo para restart)');
            process.exit(0); // Docker Compose will restart the container
          }
          
          await supabase.from('worker_control').update({ status: 'completed', processed_at: new Date().toISOString() }).eq('id', cmd.id);
        }
        return true;
      }
    } catch (err: any) {
      console.error('Erro ao processar comandos:', err.message);
    }
    return false;
  };

  let isPaused = false;

  while (true) {
    try {
      // 1. Process pending control commands
      await processCommands();

      // 2. Check if the entire engine should be paused
      // (This could also be a global flag in a system_settings table)
      const { data: controlState } = await supabase
        .from('worker_control')
        .select('command')
        .eq('status', 'completed')
        .order('processed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (controlState?.command === 'pause') {
        isPaused = true;
      } else if (controlState?.command === 'start') {
        isPaused = false;
      }

      await updateWorkerHeartbeat(isPaused ? 'paused' : 'running', {
        hostname: require('os').hostname(),
        uptime: `${Math.floor(process.uptime())}s`,
        cpu_usage: Math.floor(Math.random() * 20), // Placeholder for real metrics
        ram_usage: Math.floor(Math.random() * 30)
      });

      if (isPaused) {
        console.log(`[${new Date().toISOString()}] Worker em pausa operacional.`);
      } else {
        // 3. Buscar configurações ativas
        const { data: configs, error } = await supabase
          .from('email_configurations')
          .select('id, email_user')
          .eq('is_active', true);

        if (error) {
          console.error('Erro ao buscar configurações:', error.message);
        } else if (configs && configs.length > 0) {
          console.log(`[${new Date().toISOString()}] Processando ${configs.length} configurações ativas...`);
          
          for (const config of configs) {
            console.log(`[Worker] Iniciando processamento para: ${config.email_user}`);
            try {
              const result = await processEmailsForConfigLogic(config.id, supabase);
              if (result.success) {
                console.log(`[Worker] Sucesso para ${config.email_user}:`, result.stats);
              } else {
                console.log(`[Worker] Aviso para ${config.email_user}: ${result.error}`);
              }
            } catch (err: any) {
              console.error(`[Worker] Erro crítico na config ${config.id}:`, err.message);
            }
          }
        } else {
          console.log(`[${new Date().toISOString()}] Nenhuma configuração ativa para processar.`);
        }
      }
    } catch (globalErr: any) {
      console.error('Erro global no loop do worker:', globalErr.message);
    }

    // Esperar 1 minuto antes da próxima rodada (ou 10s se estiver pausado para checar comandos)
    const interval = isPaused ? 10000 : parseInt(process.env.CHECK_INTERVAL_MS || '60000');
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

runWorker();

