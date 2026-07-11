import { NextResponse } from 'next/server';
import {
  getPlatformStats,
  getMRRTrend,
  getTopClientsByRevenue,
  getRecentActivity,
  getPlanBreakdown,
} from '@/app/actions/super-admin';

export async function GET() {
  try {
    const [platformStats, mrrTrend, topClientsByRevenue, recentActivity, planBreakdown] =
      await Promise.all([
        getPlatformStats('30d'),
        getMRRTrend(6),
        getTopClientsByRevenue(5),
        getRecentActivity(10),
        getPlanBreakdown(),
      ]);

    return NextResponse.json({
      success: true,
      platformStats,
      mrrTrend,
      topClientsByRevenue,
      recentActivity,
      planBreakdown,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
