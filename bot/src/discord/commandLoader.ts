import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import type { SlashCommand } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load all command modules from the commands directory
 */
export async function loadCommands(): Promise<SlashCommand[]> {
  const commands: SlashCommand[] = [];
  const commandsPath = join(__dirname, '../commands');
  const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  console.log(`📦 Loading ${commandFiles.length} command file(s)...`);

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const commandModule = await import(`file://${filePath}`);

    if ('data' in commandModule && 'execute' in commandModule) {
      commands.push(commandModule as SlashCommand);
      console.log(`   ✅ Loaded: /${commandModule.data.name}`);
    } else {
      console.warn(`   ⚠️ Skipped: ${file} (missing data or execute export)`);
    }
  }

  return commands;
}
