const fs = require('fs');
let c = fs.readFileSync('src/components/ui/DailyRewardModal.tsx', 'utf8');

if (!c.includes('useTheme')) {
  c = c.replace(/import \{ useGamificationStore/, "import { useTheme } from '@/hooks/use-theme';\nimport { useGamificationStore");
}

c = c.replace(/function CheckedInCelebrationModal\(\{(.*?)\}: \{/s, (match, p1) => {
  return "function CheckedInCelebrationModal({" + p1 + "}: {";
});

if (!c.includes('const theme = useTheme()')) {
  c = c.replace(/const rotateSunburst = useRef/, "const theme = useTheme();\n  const rotateSunburst = useRef");
  c = c.replace(/export function DailyRewardModal\(\{ visible, onClose \}: DailyRewardModalProps\) \{/, "export function DailyRewardModal({ visible, onClose }: DailyRewardModalProps) {\n  const theme = useTheme();");
}

c = c.replace(/color="#FFFFFF"/g, "color={theme.text}");
c = c.replace(/color="#94A3B8"/g, "color={theme.textSecondary}");
c = c.replace(/color=\{isCurrent \? '#FFFFFF' : isPast \? '#64748B' : '#CBD5E1'\}/g, "color={isCurrent ? theme.text : theme.textSecondary}");
c = c.replace(/color=\{isCurrent \? '#FFFFFF' : '#94A3B8'\}/g, "color={isCurrent ? theme.text : theme.textSecondary}");

c = c.replace(/backgroundColor: '#1E293B'/g, "backgroundColor: theme.surface");
c = c.replace(/backgroundColor: '#0F172A'/g, "backgroundColor: theme.background");
c = c.replace(/borderColor: '#334155'/g, "borderColor: theme.border");
c = c.replace(/backgroundColor: 'rgba\(15, 23, 42, 0.6\)'/g, "backgroundColor: theme.backgroundSelected");

if (!c.includes('const getStyles =')) {
  c = c.replace(/const styles = StyleSheet.create\(\{/g, "const getStyles = (theme: any) => StyleSheet.create({");
  c = c.replace(/styles\./g, "getStyles(theme).");
}

fs.writeFileSync('src/components/ui/DailyRewardModal.tsx', c);
console.log('DailyRewardModal themed successfully.');
