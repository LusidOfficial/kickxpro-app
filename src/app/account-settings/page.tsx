/* ──────────────────────────────────────────────
   ACCOUNT SETTINGS PAGE
   Profile editing, password change, notification
   preferences, and appearance settings.
   Accessible by all roles.
   ────────────────────────────────────────────── */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import {
  IconUser, IconSettings, IconCheck, IconArrowLeft,
  IconShield, IconMail, IconActivity
} from "@/components/Icons";

interface NotificationPrefs {
  email_notifications: boolean;
  session_reminders: boolean;
  fee_reminders: boolean;
  evaluation_alerts: boolean;
  message_notifications: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  email_notifications: true,
  session_reminders: true,
  fee_reminders: true,
  evaluation_alerts: true,
  message_notifications: true,
};

export default function AccountSettingsPage() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [age, setAge] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"profile" | "password" | "notifications">("profile");

  const AVATAR_OPTIONS = ["⚽", "🏆", "🎯", "🛡️", "⭐", "🔥", "💎", "🦁"];
  const POSITIONS = ["GK", "CB", "LB", "RB", "MID", "CM", "LW", "RW", "ST", "FWD"];

  useEffect(() => {
    if (!user || !profile) return;
    setFullName(profile.full_name || "");
    setPosition(profile.position || "");
    setAge(profile.age?.toString() || "");
    setAvatarSeed(profile.avatar_seed || "");
    loadNotificationPrefs();
    setLoading(false);
  }, [user, profile]);

  async function loadNotificationPrefs() {
    if (!user) return;
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setNotifPrefs({
        email_notifications: data.email_notifications ?? true,
        session_reminders: data.session_reminders ?? true,
        fee_reminders: data.fee_reminders ?? true,
        evaluation_alerts: data.evaluation_alerts ?? true,
        message_notifications: data.message_notifications ?? true,
      });
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSaving(true);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError("Full name is required.");
      setSaving(false);
      return;
    }

    const updateData: Record<string, unknown> = {
      full_name: trimmedName,
      avatar_seed: avatarSeed,
    };

    if (profile?.role === "player") {
      updateData.position = position;
      updateData.age = age ? parseInt(age) : null;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      showToast("Profile updated successfully! ✅");
    }
    setSaving(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    const { error: pwError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (pwError) {
      setPasswordError(pwError.message);
    } else {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed successfully! 🔒");
    }
    setSavingPassword(false);
  }

  async function handleSaveNotifications() {
    if (!user) return;
    setSaving(true);

    const { error: upsertError } = await supabase
      .from("notification_preferences")
      .upsert({
        user_id: user.id,
        ...notifPrefs,
        updated_at: new Date().toISOString(),
      });

    if (upsertError) {
      setError(upsertError.message);
    } else {
      showToast("Notification preferences saved! 🔔");
    }
    setSaving(false);
  }

  function togglePref(key: keyof NotificationPrefs) {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const sections = [
    { key: "profile" as const, label: "Profile", icon: <IconUser size={16} /> },
    { key: "password" as const, label: "Security", icon: <IconShield size={16} /> },
    { key: "notifications" as const, label: "Notifications", icon: <IconMail size={16} /> },
  ];

  const initials = (fullName || "U").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Back Link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mb-6"
        >
          <IconArrowLeft size={14} /> Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-56 flex-shrink-0">
            {/* Avatar & Name */}
            <div className="text-center md:text-left mb-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-2xl font-black text-white shadow-lg mx-auto md:mx-0 mb-3">
                {avatarSeed || initials}
              </div>
              <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-heading)" }}>{fullName || "User"}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{profile.role}</p>
            </div>

            {/* Section Nav */}
            <div className="flex md:flex-col gap-2">
              {sections.map(sec => (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all w-full text-left ${
                    activeSection === sec.key
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {sec.icon} {sec.label}
                </button>
              ))}

              <div className="h-px bg-slate-100 my-2" />

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors w-full text-left"
              >
                <IconActivity size={16} /> Sign Out
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* PROFILE SECTION */}
            {activeSection === "profile" && (
              <div className="card-static p-6 md:p-8 animate-fade-up">
                <h2 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Profile Information
                </h2>
                <p className="text-xs text-slate-500 mb-6">Update your personal details and preferences.</p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">{error}</div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  {/* Avatar Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setAvatarSeed(avatarSeed === emoji ? "" : emoji)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all ${
                            avatarSeed === emoji
                              ? "border-emerald-500 bg-emerald-50 shadow-sm"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name *</label>
                    <input
                      type="text"
                      className="input"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={user?.email || ""}
                      disabled
                      style={{ opacity: 0.5, cursor: "not-allowed" }}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed from here.</p>
                  </div>

                  {profile.role === "player" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Position</label>
                        <div className="flex flex-wrap gap-1.5">
                          {POSITIONS.map(pos => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => setPosition(pos)}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all"
                              style={{
                                background: position === pos ? "rgba(16,185,129,0.1)" : "#FFF",
                                color: position === pos ? "#059669" : "var(--color-text-muted)",
                                borderColor: position === pos ? "#10B981" : "var(--color-border)",
                              }}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Age</label>
                        <input
                          type="number"
                          className="input"
                          value={age}
                          onChange={e => setAge(e.target.value)}
                          min="5"
                          max="60"
                          style={{ maxWidth: 120 }}
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                    {!saving && <IconCheck size={16} />}
                  </button>
                </form>
              </div>
            )}

            {/* PASSWORD SECTION */}
            {activeSection === "password" && (
              <div className="card-static p-6 md:p-8 animate-fade-up">
                <h2 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Change Password
                </h2>
                <p className="text-xs text-slate-500 mb-6">Keep your account secure by updating your password regularly.</p>

                {passwordError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">{passwordError}</div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">New Password *</label>
                    <input
                      type="password"
                      className="input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Confirm New Password *</label>
                    <input
                      type="password"
                      className="input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-primary py-3 px-6 flex items-center justify-center gap-2"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
                    {!savingPassword && <IconShield size={16} />}
                  </button>
                </form>
              </div>
            )}

            {/* NOTIFICATIONS SECTION */}
            {activeSection === "notifications" && (
              <div className="card-static p-6 md:p-8 animate-fade-up">
                <h2 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Notification Preferences
                </h2>
                <p className="text-xs text-slate-500 mb-6">Choose which notifications you want to receive.</p>

                <div className="space-y-4">
                  {([
                    { key: "email_notifications" as const, label: "Email Notifications", desc: "Receive updates via email" },
                    { key: "session_reminders" as const, label: "Session Reminders", desc: "Get reminded before training sessions" },
                    { key: "fee_reminders" as const, label: "Fee Reminders", desc: "Payment due date notifications" },
                    { key: "evaluation_alerts" as const, label: "Evaluation Alerts", desc: "Notified when coach posts evaluations" },
                    { key: "message_notifications" as const, label: "Message Notifications", desc: "New message alerts from coach or players" },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.label}</div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">{item.desc}</div>
                      </div>
                      <button
                        onClick={() => togglePref(item.key)}
                        className={`w-12 h-7 rounded-full transition-all relative ${
                          notifPrefs[item.key] ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${
                          notifPrefs[item.key] ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="btn-primary py-3 px-6 mt-6 flex items-center justify-center gap-2"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                  {!saving && <IconCheck size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-in font-bold text-sm">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <IconCheck size={14} color="white" />
          </div>
          {toast}
        </div>
      )}
    </div>
  );
}
