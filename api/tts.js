const { UniversalEdgeTTS } = require('../dist/index'); 

module.exports = async (req, res) => {
    // 设置允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const text = req.query.text || "测试语音";
    const voice = req.query.voice || "zh-CN-XiaoxiaoNeural";

    try {
        const tts = new UniversalEdgeTTS();
        const result = await tts.synthesize(text, voice);
        
        res.setHeader('Content-Type', 'audio/mpeg');

        // 将流式数据转发出去
        const reader = result.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }
        res.end();
    } catch (e) {
        res.status(500).send("TTS Error: " + e.message);
    }
};
