"use client";

import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { DollarSign, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function TipCalculator() {
  const [bill, setBill] = useState('100');
  const [tipPercent, setTipPercent] = useState([15]);
  const [numPeople, setNumPeople] = useState('2');

  const billAmount = parseFloat(bill) || 0;
  const numberOfPeople = parseInt(numPeople) || 1;
  const tipPercentage = tipPercent[0];

  const { tipAmount, totalAmount, totalPerPerson } = useMemo(() => {
    const tip = billAmount * (tipPercentage / 100);
    const total = billAmount + tip;
    const perPersonTotal = numberOfPeople > 0 ? total / numberOfPeople : 0;
    
    return {
      tipAmount: tip,
      totalAmount: total,
      totalPerPerson: perPersonTotal,
    };
  }, [billAmount, tipPercentage, numberOfPeople]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl rounded-2xl overflow-hidden border-2">
      <div className="md:grid md:grid-cols-2">
        <div className="p-6 md:p-8 space-y-6 bg-card">
          <CardHeader className="p-0 space-y-2">
            <CardTitle className="font-headline text-3xl font-bold text-primary">TipSplit</CardTitle>
            <CardDescription className="text-muted-foreground">Calculate tips and split bills with ease.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="bill" className="font-medium text-sm">Bill Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="bill"
                  type="number"
                  placeholder="0.00"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  className="pl-10 text-lg font-semibold"
                  aria-label="Bill Amount"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="tip" className="font-medium text-sm">Select Tip %</Label>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-lg">{tipPercentage}%</span>
              </div>
              <Slider
                id="tip"
                min={0}
                max={50}
                step={1}
                value={tipPercent}
                onValueChange={setTipPercent}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="people" className="font-medium text-sm">Number of People</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="people"
                  type="number"
                  placeholder="1"
                  value={numPeople}
                  onChange={(e) => setNumPeople(e.target.value)}
                  min={1}
                  className="pl-10 text-lg font-semibold"
                  aria-label="Number of People"
                />
              </div>
            </div>
          </CardContent>
        </div>

        <div className="bg-primary text-primary-foreground p-6 md:p-8 flex flex-col justify-between rounded-b-xl md:rounded-l-none md:rounded-r-xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-primary-foreground/80">Tip Amount</p>
              <p className="text-2xl font-bold font-headline transition-all duration-300">{formatCurrency(tipAmount)}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-primary-foreground/80">Total Bill</p>
              <p className="text-2xl font-bold font-headline transition-all duration-300">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
          <Separator className="my-6 bg-primary-foreground/20" />
          <div className="space-y-2 text-center">
            <p className="text-primary-foreground/80 font-medium">Total per person</p>
            <p className="text-5xl font-extrabold font-headline tracking-tight transition-all duration-300">{formatCurrency(totalPerPerson)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
