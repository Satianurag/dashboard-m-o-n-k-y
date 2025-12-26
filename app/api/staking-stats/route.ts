import { NextResponse } from 'next/server';
import { getClusterNodes } from '@/server/api/pnodes';

export async function GET() {
    try {
        const nodes = await getClusterNodes();

        // Calculate staking statistics from node data
        let totalStake = 0;
        let activeStake = 0;
        let delegatorCount = 0;

        nodes.forEach(node => {
            const stake = node.staking?.activatedStake || 0;
            totalStake += stake;

            if (node.status === 'online') {
                activeStake += stake;
            }

            // Sum delegated stake
            delegatorCount += node.staking?.delegatedStake || 0;
        });

        const onlineNodes = nodes.filter(n => n.status === 'online').length;
        const avgStakePerNode = nodes.length > 0 ? totalStake / nodes.length : 0;

        return NextResponse.json({
            totalStake,
            activeStake,
            delegatorCount,
            validatorCount: nodes.length,
            activeValidators: onlineNodes,
            avgStakePerNode,
            stakeUtilization: totalStake > 0 ? (activeStake / totalStake) * 100 : 0
        });
    } catch (error) {
        console.error('Staking stats error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
