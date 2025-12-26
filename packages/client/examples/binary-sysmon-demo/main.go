package main

import (
	"fmt"
	"runtime"
	"time"

	"github.com/charmbracelet/bubbles/progress"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
)

var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("86")).
			MarginLeft(2)

	infoStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("241")).
			MarginLeft(2)

	labelStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("248")).
			MarginLeft(4)

	valueStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("86")).
			Bold(true)

	helpStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("241")).
			MarginTop(1).
			MarginLeft(2)
)

type tickMsg time.Time

type model struct {
	cpuPercent  float64
	memPercent  float64
	memUsedGB   float64
	memTotalGB  float64
	cpuProgress progress.Model
	memProgress progress.Model
	hostname    string
	osInfo      string
	cpuCores    int
}

func initialModel() model {
	cpuProg := progress.New(progress.WithDefaultGradient())
	memProg := progress.New(progress.WithDefaultGradient())

	hostname, _ := host.Info()
	osName := ""
	if hostname != nil {
		osName = fmt.Sprintf("%s %s", hostname.OS, hostname.PlatformVersion)
	}

	return model{
		cpuProgress: cpuProg,
		memProgress: memProg,
		hostname:    hostname.Hostname,
		osInfo:      osName,
		cpuCores:    runtime.NumCPU(),
	}
}

func (m model) Init() tea.Cmd {
	return tickCmd()
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "q", "esc", "ctrl+c":
			return m, tea.Quit
		}

	case tickMsg:
		// 更新 CPU 使用率
		cpuPercents, _ := cpu.Percent(0, false)
		if len(cpuPercents) > 0 {
			m.cpuPercent = cpuPercents[0]
		}

		// 更新内存使用率
		memInfo, _ := mem.VirtualMemory()
		if memInfo != nil {
			m.memPercent = memInfo.UsedPercent
			m.memUsedGB = float64(memInfo.Used) / 1024 / 1024 / 1024
			m.memTotalGB = float64(memInfo.Total) / 1024 / 1024 / 1024
		}

		return m, tickCmd()

	case progress.FrameMsg:
		progressModel, cmd := m.cpuProgress.Update(msg)
		m.cpuProgress = progressModel.(progress.Model)

		progressModel2, cmd2 := m.memProgress.Update(msg)
		m.memProgress = progressModel2.(progress.Model)

		return m, tea.Batch(cmd, cmd2)
	}

	return m, nil
}

func (m model) View() string {
	s := "\n"
	s += titleStyle.Render("📊 系统监控 TUI") + "\n\n"

	// CPU 使用率
	s += labelStyle.Render("CPU 使用率:") + "\n"
	s += "    " + m.cpuProgress.ViewAs(m.cpuPercent/100.0)
	s += fmt.Sprintf("  %.1f%%\n\n", m.cpuPercent)

	// 内存使用率
	s += labelStyle.Render("内存使用率:") + "\n"
	s += "    " + m.memProgress.ViewAs(m.memPercent/100.0)
	s += fmt.Sprintf("  %.1f%% (%.2f GB / %.2f GB)\n\n", m.memPercent, m.memUsedGB, m.memTotalGB)

	// 系统信息
	s += titleStyle.Render("系统信息:") + "\n"
	s += labelStyle.Render(fmt.Sprintf("  主机名: %s", valueStyle.Render(m.hostname))) + "\n"
	s += labelStyle.Render(fmt.Sprintf("  系统: %s", valueStyle.Render(m.osInfo))) + "\n"
	s += labelStyle.Render(fmt.Sprintf("  CPU 核心: %s", valueStyle.Render(fmt.Sprintf("%d", m.cpuCores)))) + "\n\n"

	s += helpStyle.Render("按 'q' 退出")

	return s
}

func tickCmd() tea.Cmd {
	return tea.Tick(time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func main() {
	p := tea.NewProgram(initialModel())
	if _, err := p.Run(); err != nil {
		fmt.Printf("错误: %v\n", err)
	}
}
