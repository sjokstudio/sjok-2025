import React, { useState, useRef } from 'react';
import { Upload, Music, Play, Pause, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { analyzeAudioWithGemini } from './services/geminiService';
import { AnalysisStatus, MusicAnalysis, FileData } from './types';
import Visualizer from './components/Visualizer';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

const App: React.FC = () => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [analysis, setAnalysis] = useState<MusicAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("文件过大。请上传小于 10MB 的音频文件。");
      return;
    }

    if (!file.type.startsWith('audio/')) {
      setError("不支持的格式。请使用 MP3, WAV, FLAC 或 OGG。");
      return;
    }

    setError(null);
    setStatus(AnalysisStatus.UPLOADING);
    setAnalysis(null);
    setIsPlaying(false);

    try {
      const base64 = await fileToBase64(file);
      const url = URL.createObjectURL(file);
      
      const newFileData: FileData = {
        name: file.name,
        url,
        base64,
        mimeType: file.type
      };
      
      setFileData(newFileData);
      setStatus(AnalysisStatus.IDLE);
      
      // Auto start analysis
      startAnalysis(newFileData);

    } catch (e) {
      setError("文件读取失败。");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startAnalysis = async (data: FileData) => {
    setStatus(AnalysisStatus.ANALYZING);
    try {
      const result = await analyzeAudioWithGemini(data.base64, data.mimeType);
      setAnalysis(result);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (e: any) {
      setError(e.message || "分析服务暂时不可用，请稍后重试。");
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col items-center py-12 px-4 sm:px-6">
      
      {/* Brand Header */}
      <header className="w-full max-w-5xl mb-16 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">SJoK Studio 2025</h1>
          <span className="text-xs text-neutral-400 font-medium tracking-wide uppercase mt-1">
            Intelligent Audio Analysis Architecture
          </span>
        </div>
        <div className="hidden md:block">
           <div className="w-2 h-2 rounded-full bg-neutral-900 animate-pulse"></div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Input & Playback */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
          
          {/* Upload Module */}
          <div className="space-y-4">
             <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">Source Input</h2>
             
             <div 
                onClick={triggerUpload}
                className={`
                  relative h-64 w-full rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300
                  flex flex-col items-center justify-center cursor-pointer group hover:border-neutral-300 hover:shadow-md
                  ${status === AnalysisStatus.ANALYZING ? 'pointer-events-none bg-neutral-50' : ''}
                `}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="audio/*" 
                  className="hidden" 
                />

                {status === AnalysisStatus.ANALYZING ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-6 h-6 text-neutral-900 animate-spin" strokeWidth={1.5} />
                    <span className="text-neutral-500 text-xs font-medium tracking-widest uppercase">Processing</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-4 transition-transform group-hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-full bg-neutral-50 flex items-center justify-center border border-neutral-100 text-neutral-400 group-hover:text-neutral-900 group-hover:border-neutral-200 transition-colors">
                      <Upload size={20} strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                      <p className="text-neutral-900 font-medium text-sm">Upload Audio File</p>
                      <p className="text-neutral-400 text-xs mt-1">MP3, WAV, FLAC</p>
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Player Module */}
          {fileData && (
             <div className="space-y-4 fade-in">
                <div className="flex items-center justify-between">
                   <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">Playback</h2>
                   <div className="text-xs text-neutral-400 truncate max-w-[200px]">{fileData.name}</div>
                </div>
                
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm space-y-6">
                   <Visualizer audioUrl={fileData.url} isPlaying={isPlaying} />
                   
                   <div className="flex justify-center">
                     {status === AnalysisStatus.COMPLETED && (
                        <button 
                          onClick={togglePlay}
                          className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-200"
                        >
                          {isPlaying ? <Pause size={24} fill="currentColor" className="text-white" /> : <Play size={24} fill="currentColor" className="text-white ml-1" />}
                        </button>
                      )}
                   </div>
                </div>
             </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center border border-red-100">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}

        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-7 flex flex-col space-y-8">
           
           {/* Stats Module */}
           <div>
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">Metric Analysis</h2>
              <div className="grid grid-cols-2 gap-6">
                 {/* BPM */}
                 <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Tempo</span>
                    <div className="flex items-end space-x-2">
                       <span className="text-6xl font-light tracking-tighter text-neutral-900">
                         {analysis ? analysis.bpm : "—"}
                       </span>
                       <span className="text-sm text-neutral-400 pb-2 font-medium">BPM</span>
                    </div>
                 </div>

                 {/* Key */}
                 <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm flex flex-col justify-between h-48 hover:shadow-md transition-shadow">
                    <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Key Signature</span>
                    <div className="flex items-end">
                       <span className="text-5xl font-light tracking-tighter text-neutral-900 truncate">
                         {analysis ? analysis.key : "—"}
                       </span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Interpretation Module */}
           <div className="flex-grow">
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider mb-4">Interpretation</h2>
              <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm min-h-[300px] flex flex-col">
                 
                 {analysis ? (
                   <div className="flex-1 flex flex-col space-y-8 fade-in">
                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                           <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                           <h3 className="text-sm font-bold text-neutral-900">MOOD PROFILE</h3>
                        </div>
                        <p className="text-2xl font-light leading-relaxed text-neutral-800">
                          {analysis.mood}
                        </p>
                      </div>

                      <div className="border-t border-neutral-100 pt-6 mt-auto">
                        <div className="flex items-center space-x-2 mb-3">
                           <div className="w-1 h-4 bg-neutral-300 rounded-full"></div>
                           <h3 className="text-sm font-bold text-neutral-900">TECHNICAL CONTEXT</h3>
                        </div>
                        <p className="text-neutral-500 leading-relaxed text-sm">
                          {analysis.explanation}
                        </p>
                      </div>
                   </div>
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-neutral-300 space-y-4">
                      <Music size={48} strokeWidth={1} />
                      <p className="text-sm font-medium tracking-wide">Awaiting Analysis Data</p>
                   </div>
                 )}
              </div>
           </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 w-full max-w-5xl border-t border-neutral-200 pt-8 flex justify-between items-center text-xs text-neutral-400">
         <div>
            © 2025 SJoK Studio. All rights reserved.
         </div>
         <div className="flex space-x-6">
            <span>v2.5.0</span>
            <span>Gemini Powered</span>
         </div>
      </footer>
    </div>
  );
};

export default App;