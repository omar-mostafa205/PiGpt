import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { T, radius } from "../../constants/theme";
import { AppScreen } from "../../components/shared/AppScreen";
import { Icon } from "../../components/ui/Icon";
import { useUiStore } from "../../store/uiStore";
import { useProgress } from "../../hooks/useProgress";
import { getSubjectConfig } from "../../constants/subjects";
import type { Subject } from "../../types";

const BAR_COLOR: Record<Subject, string> = {
  math: T.barMath,
  physics: T.barPhysics,
  chemistry: T.barChemistry,
  accounting: T.barStatistics,
};

const DAY_LABEL = ["S", "M", "T", "W", "T", "F", "S"];

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
};

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const openSidebar = useUiStore((s) => s.openSidebar);
  const openQuiz = useUiStore((s) => s.openQuiz);
  const {
    progress,
    weakTopics,
    recentProblems,
    streakCalendar,
    loading,
    fetchProgress,
    fetchRecentProblems,
  } = useProgress();

  const refresh = async () => {
    await fetchProgress();
    await fetchRecentProblems(true);
  };

  const stats = [
    { value: String(progress?.weeklyProblems ?? 0), label: "Solved this week", fg: T.ink },
    { value: `${progress?.accuracy ?? 0}%`, label: "Accuracy", fg: T.blue },
    { value: String(progress?.streak ?? 0), label: "Day streak", fg: T.ink },
  ];

  const breakdown = progress?.subjectBreakdown ?? [];

  return (
    <AppScreen background={T.canvas}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={T.muted2} />}
      >
        <View style={[s.header, { paddingTop: insets.top + 4 }]}>
          <Pressable onPress={openSidebar} hitSlop={10} style={s.menuBtn}>
            <Icon name="menu" size={18} height={14} color={T.ink2} strokeWidth={2} />
          </Pressable>
          <Text style={s.title}>Progress</Text>
          <Text style={s.subtitle}>Last 7 days</Text>
        </View>

        <View style={s.body}>
          <View style={s.statsRow}>
            {stats.map((st) => (
              <View key={st.label} style={s.statCard}>
                <Text style={[s.statValue, { color: st.fg }]}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.card}>
            <View style={s.cardHeadRow}>
              <Text style={s.cardTitle}>Daily streak</Text>
              <Text style={s.cardMeta}>{progress?.streak ?? 0} days</Text>
            </View>
            <View style={s.week}>
              {(streakCalendar.length
                ? streakCalendar
                : Array.from({ length: 7 }, () => ({ date: "", active: false }))
              ).map((d, i) => (
                <View key={d.date || i} style={s.dayCol}>
                  <View
                    style={[
                      s.dayCell,
                      d.active
                        ? { backgroundColor: T.blue, borderColor: T.blue }
                        : { backgroundColor: "#f4f5f7", borderColor: "#eceef1" },
                    ]}
                  >
                    {d.active ? (
                      <Icon name="check" size={11} height={9} color={T.white} strokeWidth={2} />
                    ) : null}
                  </View>
                  <Text style={s.dayLabel}>
                    {d.date ? DAY_LABEL[new Date(d.date).getDay()] : DAY_LABEL[i]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {breakdown.length > 0 ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>Accuracy by subject</Text>
              <View style={s.bars}>
                {breakdown.map((b) => (
                  <View key={b.subject} style={s.barBlock}>
                    <View style={s.barLabelRow}>
                      <Text style={s.barLabel}>{getSubjectConfig(b.subject).shortLabel}</Text>
                      <Text style={s.barValue}>{b.accuracy}%</Text>
                    </View>
                    <View style={s.barTrack}>
                      <View
                        style={[
                          s.barFill,
                          { width: `${b.accuracy}%`, backgroundColor: BAR_COLOR[b.subject] ?? T.blue },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {weakTopics.length > 0 ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>Needs work</Text>
              <View style={s.weakList}>
                {weakTopics.map((w) => (
                  <View key={w.topic} style={s.weakRow}>
                    <Text style={s.weakLabel}>{w.topic}</Text>
                    <View style={s.weakPill}>
                      <Text style={s.weakPillText}>{w.accuracy}%</Text>
                    </View>
                  </View>
                ))}
              </View>
              <Pressable onPress={openQuiz} style={s.quizBtn}>
                <Text style={s.quizBtnText}>Quiz me on these</Text>
              </Pressable>
            </View>
          ) : null}

          {recentProblems.length > 0 ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>Recent activity</Text>
              <View style={s.recentList}>
                {recentProblems.map((r) => {
                  const wrong = r.correct === false;
                  return (
                    <View key={r.id} style={s.recentRow}>
                      <View
                        style={[
                          s.recentIcon,
                          { backgroundColor: wrong ? T.badBg : T.iconGoodBg },
                        ]}
                      >
                        <Icon
                          name={wrong ? "cross" : "checkSmall"}
                          size={13}
                          height={11}
                          color={wrong ? T.badFg : T.iconGoodFg}
                          strokeWidth={2}
                        />
                      </View>
                      <View style={s.recentTextCol}>
                        <Text style={s.recentTitle} numberOfLines={1}>
                          {r.question}
                        </Text>
                        <Text style={s.recentMeta}>
                          {getSubjectConfig(r.subject).shortLabel} ·{" "}
                          {r.correct === null ? "solved" : r.correct ? "correct" : "incorrect"} ·{" "}
                          {timeAgo(r.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const s = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: T.white,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  menuBtn: { width: 28, height: 28, alignItems: "flex-start", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 27, lineHeight: 32.4, fontWeight: "700", letterSpacing: -0.68, color: T.ink },
  subtitle: { marginTop: 5, fontSize: 14.5, lineHeight: 20.3, color: T.muted2 },

  body: { padding: 16, paddingBottom: 30, gap: 13 },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.card,
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
  },
  statValue: { fontSize: 25, fontWeight: "700" },
  statLabel: { marginTop: 6, fontSize: 12, lineHeight: 15, fontWeight: "500", color: T.muted2 },

  card: {
    padding: 16,
    paddingVertical: 17,
    borderRadius: radius.cardLg,
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15.5, fontWeight: "600", color: T.ink2 },
  cardMeta: { fontSize: 13, fontWeight: "600", color: T.blue },

  week: { marginTop: 14, flexDirection: "row", gap: 8 },
  dayCol: { flex: 1, alignItems: "center", gap: 7 },
  dayCell: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: { fontSize: 11, fontWeight: "500", color: T.muted3 },

  bars: { marginTop: 14, gap: 14 },
  barBlock: { gap: 7 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  barLabel: { fontSize: 13.5, fontWeight: "500", color: T.body },
  barValue: { fontSize: 13.5, fontWeight: "500", color: T.muted2 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: T.track, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },

  weakList: { marginTop: 12, gap: 12 },
  weakRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  weakLabel: { flex: 1, fontSize: 14.5, lineHeight: 18.9, fontWeight: "500", color: T.body },
  weakPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: T.weakBg },
  weakPillText: { fontSize: 12.5, fontWeight: "600", color: T.badFg },
  quizBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: T.border3,
    backgroundColor: T.white,
    alignItems: "center",
    justifyContent: "center",
  },
  quizBtnText: { fontSize: 15, fontWeight: "600", color: T.blue },

  recentList: { marginTop: 13, gap: 13 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  recentTextCol: { flex: 1, gap: 2 },
  recentTitle: { fontSize: 14.5, lineHeight: 18.1, fontWeight: "500", color: T.ink2 },
  recentMeta: { fontSize: 12.5, color: T.muted3 },
});
