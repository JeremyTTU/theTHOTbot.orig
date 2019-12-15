import { spawnSync } from 'child_process';

export class FFMpeg {
    ProcessID = 0;
    ProcessTitle = "";
    Child;

    constructor() {
        this.ProcessID = process.pid;
        this.ProcessTitle = process.title;
    }

    start(streamKey: string) {
        var options = ['-f', 'gdigrab', '-framerate', '15', '-i', `title="${process.title}"`, '-vcodec', 'h264_qsv', '-r', '15', '-b:v', '500k', '-profile:v', 'high', '-preset', 'ultrafast', '-f', 'flv', '-an', `\"rtmp://live-dfw.twitch.tv/app/${streamKey}\"`];

        this.Child = spawnSync('ffmpeg', options, {
            cwd: "C:\\ProgramData\\chocolatey\\bin",
            shell: true,
            stdio: 'ignore'
        });

    }
}