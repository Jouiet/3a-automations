module.exports = {
    apps: [
        {
            name: "a2a-server",
            script: "./automations/a2a/server.js",
            watch: false,
            env: {
                NODE_ENV: "production",
                A2A_PORT: 3000
            },
            error_file: "./logs/a2a-error.log",
            out_file: "./logs/a2a-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z"
        },
        {
            name: "autonomy-daemon",
            script: "./automations/agency/core/autonomy-daemon.cjs",
            args: "--live",
            watch: false,
            restart_delay: 60000, // Wait 1 minute before restarting if it completes/crashes
            env: {
                NODE_ENV: "production"
            },
            error_file: "./logs/daemon-error.log",
            out_file: "./logs/daemon-out.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss Z"
        }
    ]
};
