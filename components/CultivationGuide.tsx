import React from 'react';
import ReactMarkdown from 'react-markdown';

interface GuideProps {
  guide: string;
  crop: string;
}

const CultivationGuide: React.FC<GuideProps> = ({ guide, crop }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
      <div className="bg-green-50 px-8 py-6 border-b border-green-100">
        <h2 className="text-2xl font-bold text-green-900 flex items-center gap-3">
          🌱 Cultivation Guide: {crop}
        </h2>
        <p className="text-green-700 mt-1">AI-Generated personalized roadmap for your farm</p>
      </div>
      
      <div className="p-8">
        <div className="prose prose-green max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl font-bold text-green-900 mt-8 mb-4" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl font-bold text-green-800 mt-7 mb-3" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-bold text-green-800 mt-6 mb-3" {...props} />
              ),
              h4: ({ node, ...props }) => (
                <h4 className="text-lg font-semibold text-green-700 mt-5 mb-2" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="text-slate-700 mb-3 leading-relaxed" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-slate-900" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic text-slate-700" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc list-inside ml-4 mb-3 space-y-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal list-inside ml-4 mb-3 space-y-1" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="text-slate-700 mb-1" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 border-green-500 pl-4 py-2 my-3 bg-green-50 italic text-slate-700" {...props} />
              ),
              code: ({ node, inline, ...props }) =>
                inline ? (
                  <code className="bg-slate-100 px-2 py-1 rounded text-sm text-red-600 font-mono" {...props} />
                ) : (
                  <code className="block bg-slate-100 p-3 rounded-lg my-3 overflow-x-auto text-sm font-mono text-slate-800" {...props} />
                ),
              pre: ({ node, ...props }) => (
                <pre className="bg-slate-100 p-4 rounded-lg my-3 overflow-x-auto" {...props} />
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-6 border-t-2 border-slate-200" {...props} />
              ),
              table: ({ node, ...props }) => (
                <table className="w-full border-collapse border border-slate-300 my-4" {...props} />
              ),
              thead: ({ node, ...props }) => (
                <thead className="bg-slate-100" {...props} />
              ),
              tbody: ({ node, ...props }) => (
                <tbody {...props} />
              ),
              tr: ({ node, ...props }) => (
                <tr className="border-b border-slate-300" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-slate-300 px-3 py-2 text-slate-700" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="border border-slate-300 px-3 py-2 font-semibold text-slate-800" {...props} />
              ),
              a: ({ node, ...props }) => (
                <a className="text-green-600 hover:text-green-700 underline" {...props} />
              ),
            }}
            allowedElements={[
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              'p', 'strong', 'em', 'u', 'br',
              'ul', 'ol', 'li',
              'blockquote', 'code', 'pre',
              'table', 'thead', 'tbody', 'tr', 'td', 'th',
              'hr', 'a'
            ]}
          >
            {guide}
          </ReactMarkdown>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p>
            <strong>Disclaimer:</strong> This guide is generated by Artificial Intelligence based on the provided parameters. 
            Always verify with local agricultural experts before making large investments.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CultivationGuide;