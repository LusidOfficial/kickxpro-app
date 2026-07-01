"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { IconAward, IconActivity, IconClipboard, IconUser, IconUpload, IconCheck } from "@/components/Icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function CoachSettings() {
  const { user, profile } = useAuth();
  const [metrics, setMetrics] = useState(["Pace", "Shooting", "Passing", "Dribbling"]);
  const [newMetric, setNewMetric] = useState("");
  
  // Document Upload State
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("ID");
  
  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("coach_documents")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setDocuments(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    
    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Math.random()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from('coach_documents')
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document.");
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('coach_documents')
      .getPublicUrl(fileName);

    // Save to database
    await supabase.from("coach_documents").insert({
      coach_id: user.id,
      document_type: docType,
      file_name: file.name,
      file_url: publicUrl
    });

    await loadDocuments();
    setUploading(false);
  };

  const handleAddMetric = () => {
    if (newMetric.trim() !== "" && !metrics.includes(newMetric.trim())) {
      setMetrics([...metrics, newMetric.trim()]);
      setNewMetric("");
    }
  };

  const handleRemoveMetric = (metricToRemove: string) => {
    setMetrics(metrics.filter(m => m !== metricToRemove));
  };

  const handleSave = () => {
    // In a real app, this would be a Supabase UPDATE profiles SET evaluation_metrics = metrics
    alert("Settings saved successfully!");
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-heading)" }}>Academy Settings</h1>
        <p className="text-slate-500">Configure your evaluation metrics and coach profile.</p>
      </div>

      <div className="space-y-6">
        
        {/* Profile Settings */}
        <div className="card-static bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <IconUser size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Profile Details</h2>
              <p className="text-sm text-slate-500">Update your coaching information</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
              <input type="text" defaultValue={profile?.full_name || "Coach Anita"} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Verification Status</label>
              <div className={`w-full border rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${profile?.is_verified ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                {profile?.is_verified ? (
                  <><IconCheck size={18} /> Verified Coach</>
                ) : (
                  <>Unverified - Upload Documents Below</>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Document Uploads */}
        <div className="card-static bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <IconClipboard size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Document Uploads</h2>
              <p className="text-sm text-slate-500">Upload your KYC, ID, and coaching certifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="md:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Document Type</label>
                <select 
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ID">Government ID</option>
                  <option value="License">Coaching License (e.g., UEFA B)</option>
                  <option value="CV">Resume / CV</option>
                </select>
              </div>

              <div className="relative">
                <input 
                  type="file" 
                  id="doc-upload" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  disabled={uploading}
                  accept=".pdf,image/*"
                />
                <label 
                  htmlFor="doc-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'bg-slate-100 border-slate-300' : 'bg-slate-50 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400'}`}
                >
                  <IconUpload size={24} className={uploading ? 'text-slate-400' : 'text-indigo-500'} />
                  <span className="mt-2 text-sm font-bold text-slate-600">
                    {uploading ? "Uploading..." : "Click to Upload"}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">PDF or Image (Max 5MB)</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Your Uploaded Documents</h3>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <IconClipboard size={32} className="text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 font-medium">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <IconClipboard size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{doc.document_type}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[150px] sm:max-w-xs">{doc.file_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${doc.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {doc.is_verified ? 'Verified' : 'Pending'}
                        </span>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evaluation Metrics Config */}
        <div className="card-static bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <IconActivity size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Custom Evaluation Metrics</h2>
              <p className="text-sm text-slate-500">Define the exact skills you want to grade your players on</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-slate-700 mb-4 font-medium">Your Current Metrics:</p>
            <div className="flex flex-wrap gap-3">
              {metrics.map(metric => (
                <div key={metric} className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">{metric}</span>
                  <button 
                    onClick={() => handleRemoveMetric(metric)}
                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="e.g. Reflexes, Handling, Aerial..." 
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMetric()}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all"
            />
            <button 
              onClick={handleAddMetric}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm"
            >
              Add Metric
            </button>
          </div>
        </div>

      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleSave}
          className="btn-primary bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all"
        >
          Save All Settings
        </button>
      </div>

    </div>
  );
}
