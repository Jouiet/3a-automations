// automations/core/DatabaseClient.js
const { createClient } = require('@supabase/supabase-js');
const Logger = require('./Logger');
require('dotenv').config();

class DatabaseClient {
    constructor() {
        this.logger = new Logger('DatabaseClient');
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseKey = process.env.SUPABASE_ANON_KEY;

        if (!this.supabaseUrl || !this.supabaseKey) {
            this.logger.warn('Supabase credentials missing. DB operations will fail.');
        }

        this.client = createClient(this.supabaseUrl, this.supabaseKey);
    }

    async logProject(user_id, type, input_data) {
        this.logger.info(`Logging new project for user ${user_id}...`);
        const { data, error } = await this.client
            .from('projects')
            .insert([
                { user_id, type, input_data, status: 'processing' }
            ])
            .select();

        if (error) {
            this.logger.error(`DB Error: ${error.message}`);
            throw error;
        }
        return data[0];
    }

    async updateProjectStatus(project_id, status, output_assets = null) {
        this.logger.info(`Updating project ${project_id} status to ${status}...`);
        const updateData = { status };
        if (output_assets) updateData.output_assets = output_assets;

        const { data, error } = await this.client
            .from('projects')
            .update(updateData)
            .eq('id', project_id);

        if (error) {
            this.logger.error(`DB Error: ${error.message}`);
            throw error;
        }
        return data;
    }

    async getCredits(user_id) {
        const { data, error } = await this.client
            .from('users')
            .select('credits_balance')
            .eq('id', user_id)
            .single();

        if (error) throw error;
        return data.credits_balance;
    }
}

module.exports = DatabaseClient;
