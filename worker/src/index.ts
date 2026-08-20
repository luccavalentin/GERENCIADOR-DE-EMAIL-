import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { processEmailsForConfigLogic } from '../../src/lib/email-logic/processor';

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
  
  while (true) {
    try {
      // 1. Buscar configurações ativas
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
    } catch (globalErr: any) {
      console.error('Erro global no loop do worker:', globalErr.message);
    }

    // Esperar 1 minuto antes da próxima rodada (configurável)
    const interval = parseInt(process.env.CHECK_INTERVAL_MS || '60000');
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

runWorker();
