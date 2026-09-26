'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const data = [
  { day: 'Mon', inbound: 180, outbound: 120 },
  { day: 'Tue', inbound: 240, outbound: 210 },
  { day: 'Wed', inbound: 320, outbound: 150 },
  { day: 'Thu', inbound: 140, outbound: 280 },
  { day: 'Fri', inbound: 450, outbound: 310 },
  { day: 'Sat', inbound: 90, outbound: 110 },
  { day: 'Sun', inbound: 210, outbound: 80 },
];

export function MovementChart() {
  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2b" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="#859397"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#3c494c' }}
          />
          <YAxis
            stroke="#859397"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1c1b1c',
              borderColor: '#3c494c',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e5e2e3',
            }}
          />
          <Bar dataKey="inbound" name="Inbound Receipts" fill="#22d3ee" radius={[3, 3, 0, 0]} />
          <Bar dataKey="outbound" name="Outbound Deliveries" fill="#45dfa4" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
